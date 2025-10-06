// Comprehensive Agent Workflow Test Script
// Tests the complete chat-integrated agent workflow headlessly

const puppeteer = require('puppeteer');

const TEST_SCENARIOS = [
    "Erstelle ein Bild von einem Löwen",
    "Ich brauche eine Grafik von einem Klassenzimmer",
    "Kannst du ein Poster erstellen für meine Mathestunde",
    "Zeichne mir eine Visualisierung von einem Wasserstoffatom",
    "Male eine Illustration für mein Arbeitsblatt"
];

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Agent Workflow Test');
    console.log('Target URL: http://localhost:5181');

    let browser;
    try {
        // Launch browser in headless mode
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set viewport for mobile testing
        await page.setViewport({ width: 375, height: 667 });

        // Enable console logging
        page.on('console', msg => {
            console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
        });

        // Navigate to application
        console.log('\n📱 Navigating to application...');
        await page.goto('http://localhost:5181', { waitUntil: 'networkidle2' });

        // Wait for React app to load
        await page.waitForSelector('body', { timeout: 10000 });

        // Take screenshot of initial state
        await page.screenshot({ path: 'test-initial-state.png', fullPage: true });
        console.log('✅ Initial page loaded successfully');

        // Test 1: Check if chat interface is present
        console.log('\n🔍 Test 1: Checking chat interface...');

        // Look for common chat interface elements
        const chatElements = await page.evaluate(() => {
            const elements = {
                chatInput: document.querySelector('input[type="text"], textarea'),
                sendButton: document.querySelector('button[type="submit"], button:has(svg)'),
                messageArea: document.querySelector('[role="main"], .chat, .messages, .conversation')
            };

            return {
                hasInput: !!elements.chatInput,
                hasSendButton: !!elements.sendButton,
                hasMessageArea: !!elements.messageArea,
                inputPlaceholder: elements.chatInput?.placeholder || 'N/A',
                pageTitle: document.title,
                bodyText: document.body.innerText.substring(0, 500)
            };
        });

        console.log('Chat Elements Found:', chatElements);

        if (!chatElements.hasInput) {
            console.log('❌ No chat input found. Looking for navigation...');

            // Try to find and click chat navigation
            const navElements = await page.$$('button, a, [role="tab"]');
            for (let element of navElements) {
                const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
                if (text.includes('chat') || text.includes('message') || text.includes('assistent')) {
                    console.log(`🔄 Clicking navigation element: ${text}`);
                    await element.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    break;
                }
            }
        }

        // Test 2: Agent triggering tests
        console.log('\n🎯 Test 2: Agent Triggering Tests...');

        for (let i = 0; i < TEST_SCENARIOS.length; i++) {
            const testMessage = TEST_SCENARIOS[i];
            console.log(`\n🧪 Testing scenario ${i + 1}: "${testMessage}"`);

            try {
                // Find chat input (try multiple selectors)
                const inputSelector = await page.evaluate(() => {
                    const selectors = [
                        'input[type="text"]',
                        'textarea',
                        '[contenteditable="true"]',
                        'input[placeholder*="message"]',
                        'input[placeholder*="Message"]',
                        'textarea[placeholder*="message"]'
                    ];

                    for (let selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) return selector;
                    }
                    return null;
                });

                if (!inputSelector) {
                    console.log('❌ No chat input found for this scenario');
                    continue;
                }

                // Clear and type message
                await page.click(inputSelector);
                await page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    if (element) element.value = '';
                }, inputSelector);

                await page.type(inputSelector, testMessage);
                await new Promise(resolve => setTimeout(resolve, 500));

                // Find and click send button
                const sendButtonSelector = await page.evaluate(() => {
                    const selectors = [
                        'button[type="submit"]',
                        'button:has(svg)',
                        'button[aria-label*="send"]',
                        'button[aria-label*="Send"]',
                        'form button:last-of-type'
                    ];

                    for (let selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) return selector;
                    }

                    // Try to find button near input
                    const buttons = document.querySelectorAll('button');
                    for (let button of buttons) {
                        const text = button.textContent?.toLowerCase() || '';
                        if (text.includes('send') || text.includes('senden') || button.querySelector('svg')) {
                            return `button:nth-of-type(${Array.from(buttons).indexOf(button) + 1})`;
                        }
                    }
                    return null;
                });

                if (sendButtonSelector) {
                    await page.click(sendButtonSelector);
                    console.log('✅ Message sent successfully');
                } else {
                    // Try pressing Enter
                    await page.keyboard.press('Enter');
                    console.log('✅ Message sent via Enter key');
                }

                // Wait for response and check for agent confirmation
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check for agent confirmation modal/message
                const agentResponse = await page.evaluate(() => {
                    const text = document.body.innerText.toLowerCase();

                    return {
                        hasAgentConfirmation: text.includes('agent') && (text.includes('starten') || text.includes('start')),
                        hasConfirmationButtons: document.querySelector('button')?.textContent?.includes('Ja') || false,
                        hasProgressMessage: text.includes('progress') || text.includes('generating'),
                        hasResultMessage: text.includes('result') || text.includes('completed'),
                        bodySnapshot: document.body.innerText.substring(0, 1000)
                    };
                });

                console.log('Agent Response Analysis:', {
                    hasAgentConfirmation: agentResponse.hasAgentConfirmation,
                    hasConfirmationButtons: agentResponse.hasConfirmationButtons,
                    hasProgressMessage: agentResponse.hasProgressMessage,
                    hasResultMessage: agentResponse.hasResultMessage
                });

                // If confirmation buttons found, test clicking them
                if (agentResponse.hasConfirmationButtons) {
                    console.log('🎉 Agent confirmation modal detected!');

                    // Take screenshot of confirmation state
                    await page.screenshot({
                        path: `test-confirmation-${i + 1}.png`,
                        fullPage: true
                    });

                    // Try to click "Ja" button
                    const confirmButtons = await page.$$('button');
                    for (let button of confirmButtons) {
                        const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
                        if (text.includes('ja') || text.includes('start')) {
                            console.log('🚀 Clicking confirmation button...');
                            await button.click();
                            await new Promise(resolve => setTimeout(resolve, 3000));

                            // Check for progress/execution
                            const executionState = await page.evaluate(() => {
                                const text = document.body.innerText.toLowerCase();
                                return {
                                    hasProgress: text.includes('progress') || text.includes('generating') || text.includes('processing'),
                                    hasResult: text.includes('result') || text.includes('completed') || text.includes('image'),
                                    bodySnapshot: document.body.innerText.substring(0, 1000)
                                };
                            });

                            console.log('Execution State:', executionState);

                            // Take screenshot of execution result
                            await page.screenshot({
                                path: `test-execution-${i + 1}.png`,
                                fullPage: true
                            });

                            break;
                        }
                    }
                }

                console.log(`✅ Scenario ${i + 1} completed`);

            } catch (error) {
                console.log(`❌ Scenario ${i + 1} failed:`, error.message);
            }

            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Test 3: Error handling
        console.log('\n🔧 Test 3: Error Handling...');

        // Test with invalid input
        try {
            const inputSelector = 'input[type="text"], textarea';
            const invalidMessage = "This should not trigger any agent but test error handling";

            await page.click(inputSelector);
            await page.type(inputSelector, invalidMessage);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            const errorResponse = await page.evaluate(() => {
                const text = document.body.innerText.toLowerCase();
                return {
                    hasError: text.includes('error') || text.includes('fehler'),
                    hasNoAgentMessage: !text.includes('agent'),
                    normalResponse: true
                };
            });

            console.log('Error Handling Test:', errorResponse);

        } catch (error) {
            console.log('❌ Error handling test failed:', error.message);
        }

        // Final screenshot
        await page.screenshot({ path: 'test-final-state.png', fullPage: true });

        console.log('\n🎉 Comprehensive Agent Workflow Test Completed!');
        console.log('📸 Screenshots saved: test-initial-state.png, test-confirmation-*.png, test-execution-*.png, test-final-state.png');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    require('puppeteer');
    runComprehensiveTest();
} catch (error) {
    console.log('❌ Puppeteer not available. Installing...');
    console.log('Please run: npm install puppeteer');
    console.log('Then run this script again.');
}