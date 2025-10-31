import { Router, Request, Response } from 'express';
import { getInstantDB, isInstantDBAvailable } from '../services/instantdbService';

const router = Router();

// GET /api/admin/usage/today
router.get('/usage/today', async (req: Request, res: Response) => {
  if (!isInstantDBAvailable()) {
    return res.status(503).json({ success: false, error: 'Database unavailable' });
  }

  try {
    const db = getInstantDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    // Count images created today, grouped by user (creation + edits)
    const queryResult = await db.query({
      library_materials: {
        $: {
          where: { type: 'image' },
          order: { by: 'created_at', direction: 'desc' },
        },
      },
    });

    const images = (queryResult.library_materials || []).filter(
      (m: any) => m.created_at >= todayTs
    );

    const byUser: Record<string, number> = {};
    for (const item of images) {
      const uid = item.user_id || 'unknown';
      byUser[uid] = (byUser[uid] || 0) + 1;
    }

    const response = {
      success: true,
      data: {
        total: images.length,
        byUser: Object.entries(byUser).map(([user_id, count]) => ({ user_id, count })),
      },
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed' });
  }
});

// GET /api/admin/costs/month
router.get('/costs/month', async (req: Request, res: Response) => {
  if (!isInstantDBAvailable()) {
    return res.status(503).json({ success: false, error: 'Database unavailable' });
  }

  try {
    const db = getInstantDB();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Query cost events (if collection exists); otherwise, estimate from library_materials
    let costs: any[] = [];
    try {
      const costResult = await db.query({
        api_costs: {
          $: { order: { by: 'timestamp', direction: 'desc' } },
        },
      });
      costs = (costResult.api_costs || []).filter((c: any) => c.timestamp >= monthStart);
    } catch (_) {
      costs = [];
    }

    // Fallback estimation if api_costs not present
    if (costs.length === 0) {
      const imgs = await db.query({
        library_materials: {
          $: { where: { type: 'image' }, order: { by: 'created_at', direction: 'desc' } },
        },
      });
      const monthImages = (imgs.library_materials || []).filter(
        (m: any) => m.created_at >= monthStart
      );
      // Assume DALL-E for create and Gemini for edits by inspecting metadata
      for (const m of monthImages) {
        const meta = m.metadata || '';
        if (typeof meta === 'string' && meta.includes('revised_prompt')) {
          costs.push({ service: 'dalle', cost: 0.04 });
        } else if (typeof meta === 'string' && meta.includes('originalImageId')) {
          costs.push({ service: 'gemini', cost: 0.039 });
        }
      }
    }

    const totals = costs.reduce(
      (acc: any, c: any) => {
        const svc = c.service || 'unknown';
        const amt = typeof c.cost === 'number' ? c.cost : 0;
        acc.total += amt;
        acc.byService[svc] = (acc.byService[svc] || 0) + amt;
        return acc;
      },
      { total: 0, byService: {} as Record<string, number> }
    );

    return res.json({ success: true, data: totals });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed' });
  }
});

export default router;


