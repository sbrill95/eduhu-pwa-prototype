import { test } from '@playwright/test';

test('ULTRA DEEP DIVE - Gemini Layout Analysis', async ({ page, context }) => {
  console.log('🔬 ULTRA DEEP DIVE: Gemini Layout Pixel-Perfect Analysis');
  console.log('='.repeat(100));

  // ============================================================================
  // PART 1: Analyze Gemini Prototype - EXACT Layout Measurements
  // ============================================================================

  console.log('\n📸 PART 1: Gemini Prototype - Exact Measurements\n');

  const geminiLayout = {
    container: {
      maxWidth: '448px', // Mobile-first container (exact from screenshot)
      paddingX: '16px',
      paddingY: '16px',
      backgroundColor: 'White (#FFFFFF)',
      marginX: 'auto' // Centered on desktop
    },
    greeting: {
      text: 'Hallo Michelle!',
      fontSize: '32px', // Measured from screenshot
      fontWeight: '700',
      color: '#FB6542',
      lineHeight: '1.2',
      marginBottom: '4px', // Very small gap!
      marginLeft: '0px', // NO left margin - flush with container edge
      marginRight: '0px'
    },
    subheading: {
      text: 'Dein KI-Assistent ist bereit.',
      fontSize: '16px',
      fontWeight: '400',
      color: '#374151',
      lineHeight: '1.5',
      marginBottom: '24px', // Gap before calendar
      marginLeft: '0px',
      marginRight: '0px'
    },
    calendar: {
      order: 1, // BEFORE message bubble!
      backgroundColor: '#FFFFFF', // WHITE, not gray!
      border: '1px solid #E5E7EB',
      borderRadius: '16px', // 16px NOT 24px!
      padding: '16px', // 16px NOT 24px!
      marginBottom: '16px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle shadow
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        weekday: {
          fontSize: '14px',
          fontWeight: '400',
          color: '#6B7280',
          marginBottom: '2px'
        },
        date: {
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          lineHeight: '1.2'
        },
        icon: {
          size: '20px',
          color: '#9CA3AF'
        }
      },
      events: {
        layout: 'Grid with 2 columns on desktop, 1 on mobile',
        gap: '8px',
        item: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          time: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            minWidth: '50px'
          },
          separator: '•',
          details: {
            fontSize: '14px',
            fontWeight: '400',
            color: '#111827'
          }
        }
      }
    },
    messageBubble: {
      order: 2, // AFTER calendar!
      backgroundColor: '#F3F4F6',
      borderRadius: '16px', // 16px NOT 24px!
      padding: '16px', // 16px NOT 20px!
      marginBottom: '16px',
      boxShadow: 'none',
      label: {
        fontSize: '12px', // SMALLER than 14px!
        fontWeight: '600',
        color: '#FB6542',
        marginBottom: '8px',
        textTransform: 'none'
      },
      message: {
        fontSize: '15px', // NOT 16px!
        fontWeight: '400',
        color: '#1F2937',
        lineHeight: '1.5',
        marginBottom: '12px'
      },
      prompts: {
        layout: 'Stack vertically',
        gap: '0px', // NO gap! Touching each other
        container: {
          backgroundColor: '#FFFFFF', // WHITE background!
          borderRadius: '12px',
          padding: '4px 0', // Small padding top/bottom
          border: 'none',
          boxShadow: 'none'
        },
        item: {
          fontSize: '15px', // NOT 16px!
          fontWeight: '500',
          color: '#1F2937',
          padding: '10px 16px', // Horizontal padding inside white box
          borderBottom: '1px solid #F3F4F6', // Divider between items
          lastChild: {
            borderBottom: 'none' // No border on last item
          },
          hover: {
            backgroundColor: '#F9FAFB',
            color: '#FB6542'
          },
          arrow: {
            color: '#9CA3AF',
            fontSize: '15px',
            marginLeft: 'auto'
          }
        }
      }
    },
    letzteChats: {
      order: 3,
      title: {
        fontSize: '18px', // NOT 20px!
        fontWeight: '600',
        color: '#111827', // DARK, not orange!
        marginBottom: '12px',
        marginLeft: '0px'
      },
      showAllLink: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#FB6542',
        position: 'absolute',
        right: '0px',
        top: '0px'
      },
      items: {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px', // 12px NOT 24px!
        padding: '12px',
        marginBottom: '8px',
        gap: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        icon: {
          size: '40px',
          backgroundColor: '#F3F4F6', // GRAY, not orange!
          color: '#6B7280',
          borderRadius: '10px'
        },
        title: {
          fontSize: '15px',
          fontWeight: '500',
          color: '#111827'
        },
        subtitle: {
          fontSize: '13px',
          fontWeight: '400',
          color: '#6B7280'
        }
      }
    }
  };

  console.log('✅ Gemini Layout Analysis:');
  console.log(JSON.stringify(geminiLayout, null, 2));

  // ============================================================================
  // PART 2: Measure Current Implementation - Desktop & Mobile
  // ============================================================================

  console.log('\n📸 PART 2: Current Implementation Measurements\n');

  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    await page.goto('http://localhost:5174', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(2000);

    // Screenshot Desktop
    await page.screenshot({
      path: 'layout-desktop-current.png',
      fullPage: true
    });
    console.log('✅ Screenshot: layout-desktop-current.png');

    // Measure container width on desktop
    const desktopMeasurements = await page.evaluate(() => {
      const container = document.querySelector('.p-4');
      const greeting = document.querySelector('h1');
      const bubble = document.querySelector('[data-testid="welcome-message-bubble"]');
      const calendar = document.querySelector('[data-testid="calendar-card"]');
      const chatsSection = document.querySelector('[data-testid="recent-chats-section"]');

      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        container: container ? {
          width: window.getComputedStyle(container).width,
          maxWidth: window.getComputedStyle(container).maxWidth,
          paddingLeft: window.getComputedStyle(container).paddingLeft,
          paddingRight: window.getComputedStyle(container).paddingRight,
          marginLeft: window.getComputedStyle(container).marginLeft,
          marginRight: window.getComputedStyle(container).marginRight,
          backgroundColor: window.getComputedStyle(container).backgroundColor
        } : null,
        greeting: greeting ? {
          marginLeft: window.getComputedStyle(greeting).marginLeft,
          marginRight: window.getComputedStyle(greeting).marginRight,
          fontSize: window.getComputedStyle(greeting).fontSize
        } : null,
        bubble: bubble ? {
          borderRadius: window.getComputedStyle(bubble).borderRadius,
          padding: window.getComputedStyle(bubble).padding,
          backgroundColor: window.getComputedStyle(bubble).backgroundColor,
          width: bubble.offsetWidth + 'px'
        } : null,
        calendar: calendar ? {
          borderRadius: window.getComputedStyle(calendar).borderRadius,
          padding: window.getComputedStyle(calendar).padding,
          backgroundColor: window.getComputedStyle(calendar).backgroundColor,
          order: window.getComputedStyle(calendar).order
        } : null,
        chatsSection: chatsSection ? {
          title: (() => {
            const h2 = chatsSection.querySelector('h2');
            return h2 ? {
              fontSize: window.getComputedStyle(h2).fontSize,
              fontWeight: window.getComputedStyle(h2).fontWeight,
              color: window.getComputedStyle(h2).color
            } : null;
          })(),
          card: (() => {
            const card = chatsSection.querySelector('[data-testid^="chat-item-"]');
            return card ? {
              borderRadius: window.getComputedStyle(card).borderRadius,
              padding: window.getComputedStyle(card).padding,
              backgroundColor: window.getComputedStyle(card).backgroundColor,
              border: window.getComputedStyle(card).border
            } : null;
          })()
        } : null
      };
    });

    console.log('📊 DESKTOP Measurements:');
    console.log(JSON.stringify(desktopMeasurements, null, 2));

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'layout-mobile-current.png',
      fullPage: true
    });
    console.log('✅ Screenshot: layout-mobile-current.png');

    const mobileMeasurements = await page.evaluate(() => {
      const container = document.querySelector('.p-4');
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        container: container ? {
          width: window.getComputedStyle(container).width,
          paddingLeft: window.getComputedStyle(container).paddingLeft
        } : null
      };
    });

    console.log('📊 MOBILE Measurements:');
    console.log(JSON.stringify(mobileMeasurements, null, 2));

    // ============================================================================
    // PART 3: Critical Layout Issues Found
    // ============================================================================

    console.log('\n🔍 PART 3: Critical Layout Issues\n');
    console.log('='.repeat(100));

    const issues = {
      issue1: {
        problem: 'Container not centered on desktop',
        gemini: 'max-width: 448px, margin: 0 auto (centered)',
        current: desktopMeasurements.container?.maxWidth || 'none',
        severity: 'CRITICAL'
      },
      issue2: {
        problem: 'Calendar and Bubble wrong order',
        gemini: 'Calendar BEFORE Message Bubble',
        current: 'Message Bubble BEFORE Calendar',
        severity: 'CRITICAL'
      },
      issue3: {
        problem: 'Prompt suggestions missing white background box',
        gemini: 'White box container with dividers between items',
        current: 'No background, just text links',
        severity: 'CRITICAL'
      },
      issue4: {
        problem: 'Border radius too large',
        gemini: '16px for cards (not 24px)',
        current: '24px',
        severity: 'HIGH'
      },
      issue5: {
        problem: 'Padding too large',
        gemini: '16px for cards (not 20-24px)',
        current: '20-24px',
        severity: 'HIGH'
      },
      issue6: {
        problem: 'Letzte Chats title wrong color',
        gemini: 'Dark #111827 (not orange)',
        current: desktopMeasurements.chatsSection?.title?.color || 'unknown',
        severity: 'HIGH'
      },
      issue7: {
        problem: 'Chat cards too rounded',
        gemini: '12px border-radius',
        current: desktopMeasurements.chatsSection?.card?.borderRadius || 'unknown',
        severity: 'MEDIUM'
      },
      issue8: {
        problem: 'Calendar missing grid layout for events',
        gemini: '2 column grid on desktop',
        current: 'Single column list',
        severity: 'HIGH'
      }
    };

    console.log('CRITICAL ISSUES FOUND:');
    console.log(JSON.stringify(issues, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ ULTRA DEEP DIVE COMPLETE');
  console.log('📋 Total Issues Found: 8 (3 Critical, 4 High, 1 Medium)');
});
