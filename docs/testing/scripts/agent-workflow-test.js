// Focused Agent Workflow Test - Post Render Loop Fix
const puppeteer = require('puppeteer');

async function testAgentWorkflow() {
    console.log('🚀 Testing Agent Workflow (Post-Fix)');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 375, height: 667 });

        // Monitor console for issues
        let renderErrors = 0;
        let circuitBreakerTriggered = false;

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('CIRCUIT BREAKER')) {
                circuitBreakerTriggered = true;
                renderErrors++;
            }
            if (text.includes('High render frequency')) {
                renderErrors++;
            }
            console.log(`[${msg.type()}]: ${text}`);
        });

        // Navigate to app
        console.log('\n📱 Loading application...');
        await page.goto('http://localhost:5181', { waitUntil: 'networkidle2' });

        // Wait for React to stabilize
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`\n📊 Render Health Check: ${renderErrors} render issues detected`);
        console.log(`Circuit Breaker Triggered: ${circuitBreakerTriggered ? 'YES ❌' : 'NO ✅'}`);

        // Navigate to chat
        console.log('\n🔄 Navigating to chat interface...');

        // Try to find chat navigation button by text content
        const chatButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a, [role="tab"]'));
            return buttons.find(btn => {
                const text = btn.textContent?.toLowerCase() || '';
                return text.includes('chat') || text.includes('message') || text.includes('assistent');
            });
        });

        if (chatButton) {
            // Click the chat button using JavaScript
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a, [role="tab"]'));
                const chatBtn = buttons.find(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    return text.includes('chat') || text.includes('message') || text.includes('assistent');
                });
                if (chatBtn) chatBtn.click();
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Test agent triggering
        console.log('\n🎯 Testing agent trigger phrase...');

        // Find chat input
        const input = await page.$('input[type="text"], textarea');
        if (input) {
            await input.click();
            await input.type('Erstelle ein Bild von einem Löwen');

            // Send message
            await page.keyboard.press('Enter');

            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Check for agent confirmation
            const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

            const hasAgentConfirmation = pageText.includes('agent') &&
                                       (pageText.includes('starten') || pageText.includes('start'));

            console.log(`Agent Confirmation Detected: ${hasAgentConfirmation ? 'YES ✅' : 'NO ❌'}`);

            // Take screenshot
            await page.screenshot({
                path: 'agent-test-result.png',
                fullPage: true
            });

            // Final render health check
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`\n📊 Final Render Health: ${renderErrors} total render issues`);

            return {
                renderHealthy: !circuitBreakerTriggered && renderErrors < 10,
                agentTriggered: hasAgentConfirmation,
                totalRenderIssues: renderErrors
            };

        } else {
            console.log('❌ Chat input not found');
            return { renderHealthy: false, agentTriggered: false, totalRenderIssues: renderErrors };
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { renderHealthy: false, agentTriggered: false, error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testAgentWorkflow().then(result => {
    console.log('\n🎯 FINAL TEST RESULTS:');
    console.log(`Render Performance: ${result.renderHealthy ? '✅ HEALTHY' : '❌ ISSUES'}`);
    console.log(`Agent Triggering: ${result.agentTriggered ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`Total Render Issues: ${result.totalRenderIssues || 0}`);

    if (result.error) {
        console.log(`Error: ${result.error}`);
    }

    console.log('\n📸 Screenshot saved: agent-test-result.png');
});