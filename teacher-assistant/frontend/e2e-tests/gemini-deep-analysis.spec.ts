import { test } from '@playwright/test';

test('Deep Analysis - Gemini Prototype vs Implementation', async ({ page }) => {
  console.log('🔬 DEEP ANALYSIS: Gemini Prototype vs Implementation');
  console.log('='.repeat(80));

  // ============================================================================
  // PART 1: Analyze Gemini Prototype Screenshots
  // ============================================================================

  console.log('\n📸 PART 1: Analyzing Gemini Prototype Screenshots...\n');

  const geminiAnalysis = {
    greeting: {
      text: 'Hallo Michelle!',
      fontSize: 'Very large (approx 32-36px)',
      fontWeight: 'Bold (700)',
      color: 'Orange (#FB6542 or similar)',
      marginBottom: 'Small (8-12px)',
      exclamationMark: true
    },
    subheading: {
      text: 'Dein KI-Assistent ist bereit.',
      fontSize: 'Medium (16px)',
      fontWeight: 'Normal (400)',
      color: 'Dark gray (#374151)',
      marginBottom: 'Medium (16-24px)'
    },
    messageBubble: {
      backgroundColor: 'Light gray (#F3F4F6)',
      borderRadius: '24px (rounded-2xl)',
      padding: '20px',
      marginBottom: '16-24px',
      label: {
        text: 'eduhu',
        fontSize: 'Small (14px)',
        fontWeight: 'Semibold (600)',
        color: 'Orange (#FB6542)',
        marginBottom: '8px'
      },
      message: {
        text: 'Hallo Michelle! Ich habe einen Blick auf deinen Tag geworfen und ein paar Ideen vorbereitet. Wollen wir loslegen?',
        fontSize: 'Medium (16px)',
        fontWeight: 'Normal (400)',
        color: 'Dark (#1F2937)',
        lineHeight: '1.6',
        marginBottom: '16px'
      },
      prompts: {
        style: 'Text links WITHOUT background',
        layout: 'Vertical stack',
        spacing: '8-12px between items',
        fontSize: '16px',
        fontWeight: 'Medium (500)',
        color: 'Dark (#1F2937)',
        hoverColor: 'Orange (#FB6542)',
        arrow: 'Right arrow → at the end',
        examples: [
          'Planung Mathe starten →',
          'Planung Englisch starten →'
        ]
      }
    },
    calendar: {
      backgroundColor: 'Very light gray (#F9FAFB)',
      border: '1px solid #E5E7EB',
      borderRadius: '24px',
      padding: '24px',
      marginBottom: '16-24px',
      header: {
        layout: 'Flex row, space-between',
        weekday: {
          text: 'Donnerstag',
          fontSize: 'Small (14px)',
          color: 'Gray (#6B7280)',
          fontWeight: 'Normal (400)'
        },
        date: {
          text: '09. Okt',
          fontSize: 'Large (24px)',
          fontWeight: 'Bold (700)',
          color: 'Dark (#111827)',
          marginTop: '4px'
        },
        icon: {
          position: 'Top right',
          size: '24px',
          color: 'Gray (#9CA3AF)'
        }
      },
      events: {
        layout: 'Vertical list',
        spacing: '12px between items',
        item: {
          display: 'Flex row, align center',
          gap: '12px',
          time: {
            text: '08:30',
            fontSize: '16px',
            fontWeight: 'Medium (500)',
            color: 'Dark (#111827)',
            minWidth: '60px'
          },
          separator: {
            text: '•',
            color: 'Gray (#9CA3AF)',
            fontSize: '16px'
          },
          details: {
            text: 'Klasse 8a, Mathematik',
            fontSize: '16px',
            fontWeight: 'Normal (400)',
            color: 'Dark (#111827)'
          }
        }
      },
      emptyState: {
        text: 'Keine anstehenden Termine',
        fontSize: '14px',
        color: 'Gray (#6B7280)',
        textAlign: 'center',
        paddingY: '32px'
      }
    }
  };

  console.log('✅ Gemini Prototype Analysis Complete');
  console.log(JSON.stringify(geminiAnalysis, null, 2));

  // ============================================================================
  // PART 2: Analyze Current Implementation
  // ============================================================================

  console.log('\n📸 PART 2: Analyzing Current Implementation...\n');

  try {
    await page.goto('http://localhost:5174', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(2000);

    // Take detailed screenshots
    await page.screenshot({
      path: 'analysis-current-full.png',
      fullPage: true
    });
    console.log('✅ Screenshot: analysis-current-full.png');

    await page.screenshot({
      path: 'analysis-current-viewport.png',
      fullPage: false
    });
    console.log('✅ Screenshot: analysis-current-viewport.png');

    // Analyze greeting header
    const greetingAnalysis = await page.evaluate(() => {
      const greeting = document.querySelector('h1');
      if (!greeting) return null;

      const styles = window.getComputedStyle(greeting);
      return {
        text: greeting.textContent?.trim(),
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        marginBottom: styles.marginBottom,
        fontFamily: styles.fontFamily
      };
    });
    console.log('📊 Greeting Analysis:', greetingAnalysis);

    // Analyze subheading
    const subheadingAnalysis = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (!h1 || !h1.nextElementSibling) return null;

      const subheading = h1.nextElementSibling as HTMLElement;
      const styles = window.getComputedStyle(subheading);
      return {
        text: subheading.textContent?.trim(),
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        marginBottom: styles.marginBottom
      };
    });
    console.log('📊 Subheading Analysis:', subheadingAnalysis);

    // Analyze message bubble
    const bubbleAnalysis = await page.evaluate(() => {
      const bubble = document.querySelector('[data-testid="welcome-message-bubble"]');
      if (!bubble) return null;

      const styles = window.getComputedStyle(bubble);
      const label = bubble.querySelector('div:first-child');
      const message = bubble.querySelector('p');
      const prompts = bubble.querySelectorAll('button');

      return {
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        padding: styles.padding,
        marginBottom: styles.marginBottom,
        label: label ? {
          text: label.textContent?.trim(),
          fontSize: window.getComputedStyle(label).fontSize,
          fontWeight: window.getComputedStyle(label).fontWeight,
          color: window.getComputedStyle(label).color
        } : null,
        message: message ? {
          text: message.textContent?.trim().substring(0, 50) + '...',
          fontSize: window.getComputedStyle(message).fontSize,
          fontWeight: window.getComputedStyle(message).fontWeight,
          color: window.getComputedStyle(message).color,
          lineHeight: window.getComputedStyle(message).lineHeight
        } : null,
        promptCount: prompts.length,
        firstPrompt: prompts[0] ? {
          text: prompts[0].textContent?.trim(),
          fontSize: window.getComputedStyle(prompts[0]).fontSize,
          fontWeight: window.getComputedStyle(prompts[0]).fontWeight,
          color: window.getComputedStyle(prompts[0]).color,
          backgroundColor: window.getComputedStyle(prompts[0]).backgroundColor
        } : null
      };
    });
    console.log('📊 Message Bubble Analysis:', JSON.stringify(bubbleAnalysis, null, 2));

    // Analyze calendar
    const calendarAnalysis = await page.evaluate(() => {
      const calendar = document.querySelector('[data-testid="calendar-card"]');
      if (!calendar) return null;

      const styles = window.getComputedStyle(calendar);
      const weekday = calendar.querySelector('p');
      const date = calendar.querySelector('h3');

      return {
        backgroundColor: styles.backgroundColor,
        border: styles.border,
        borderRadius: styles.borderRadius,
        padding: styles.padding,
        weekday: weekday ? {
          text: weekday.textContent?.trim(),
          fontSize: window.getComputedStyle(weekday).fontSize,
          fontWeight: window.getComputedStyle(weekday).fontWeight,
          color: window.getComputedStyle(weekday).color
        } : null,
        date: date ? {
          text: date.textContent?.trim(),
          fontSize: window.getComputedStyle(date).fontSize,
          fontWeight: window.getComputedStyle(date).fontWeight,
          color: window.getComputedStyle(date).color
        } : null
      };
    });
    console.log('📊 Calendar Analysis:', JSON.stringify(calendarAnalysis, null, 2));

    // ============================================================================
    // PART 3: Detailed Comparison
    // ============================================================================

    console.log('\n🔍 PART 3: Detailed Comparison\n');
    console.log('='.repeat(80));

    const differences = {
      greeting: {
        issue: greetingAnalysis?.color !== 'rgb(251, 101, 66)' ? '❌ Color not matching Gemini Orange' : '✅ Color OK',
        expected: 'rgb(251, 101, 66) - #FB6542',
        actual: greetingAnalysis?.color
      },
      bubble: {
        bgIssue: bubbleAnalysis?.backgroundColor !== 'rgb(243, 244, 246)' ? '❌ Background not matching' : '✅ Background OK',
        expectedBg: 'rgb(243, 244, 246) - #F3F4F6',
        actualBg: bubbleAnalysis?.backgroundColor,
        labelIssue: bubbleAnalysis?.label?.color !== 'rgb(251, 101, 66)' ? '❌ Label color not matching' : '✅ Label OK',
        promptBgIssue: bubbleAnalysis?.firstPrompt?.backgroundColor !== 'rgba(0, 0, 0, 0)' ? '❌ Prompt has background' : '✅ Prompt transparent'
      },
      calendar: {
        bgIssue: calendarAnalysis?.backgroundColor !== 'rgb(249, 250, 251)' ? '❌ Background not matching' : '✅ Background OK',
        expectedBg: 'rgb(249, 250, 251) - #F9FAFB',
        actualBg: calendarAnalysis?.backgroundColor
      }
    };

    console.log('DIFFERENCES FOUND:');
    console.log(JSON.stringify(differences, null, 2));

  } catch (error) {
    console.error('❌ Analysis Error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ DEEP ANALYSIS COMPLETE');
});
