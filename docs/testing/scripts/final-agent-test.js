// Final Agent Workflow Test
const puppeteer = require('puppeteer');

async function finalAgentTest() {
    console.log('🎯 FINAL AGENT WORKFLOW TEST');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 375, height: 667 });

        // Track console for agent-related messages
        let renderIssues = 0;
        let agentConfirmationMessage = false;
        let agentStartMessage = false;

        page.on('console', msg => {
            const text = msg.text();
            console.log(`[CONSOLE]: ${text}`);

            if (text.includes('CIRCUIT BREAKER') || text.includes('High render frequency')) {
                renderIssues++;
            }
            if (text.includes('Agent confirmation created') || text.includes('agent confirmation')) {
                agentConfirmationMessage = true;
            }
            if (text.includes('Agent started') || text.includes('starting agent')) {
                agentStartMessage = true;
            }
        });

        // Load application
        console.log('\n📱 Loading application...');
        await page.goto('http://localhost:5181', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Take initial screenshot
        await page.screenshot({ path: 'final-test-step1-home.png', fullPage: true });

        // Click on Chat tab in bottom navigation
        console.log('\n🔄 Navigating to Chat...');
        await page.evaluate(() => {
            // Look for the Chat tab in bottom navigation
            const chatElement = Array.from(document.querySelectorAll('*')).find(el => {
                const text = el.textContent?.trim().toLowerCase();
                return text === 'chat' && (el.tagName === 'ION-TAB-BUTTON' ||
                       el.closest('ion-tab-button') ||
                       el.classList.contains('tab') ||
                       el.role === 'tab');
            });

            if (chatElement) {
                console.log('Found chat tab, clicking...');
                chatElement.click();
                return true;
            }

            // Fallback: click any element containing "Chat"
            const anyChat = Array.from(document.querySelectorAll('*')).find(el =>
                el.textContent?.includes('Chat') && el.offsetParent !== null
            );
            if (anyChat) {
                console.log('Found chat element, clicking...');
                anyChat.click();
                return true;
            }

            return false;
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take chat screenshot
        await page.screenshot({ path: 'final-test-step2-chat.png', fullPage: true });

        // Look for chat input
        console.log('\n🔍 Looking for chat input...');
        const inputFound = await page.evaluate(() => {
            const selectors = [
                'input[type="text"]',
                'textarea',
                'ion-input input',
                'ion-textarea textarea',
                '[contenteditable="true"]'
            ];

            for (let selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null) {
                    console.log(`Found input with selector: ${selector}`);
                    return selector;
                }
            }

            // Look for any visible input elements
            const allInputs = document.querySelectorAll('input, textarea');
            for (let input of allInputs) {
                if (input.offsetParent !== null) {
                    console.log(`Found visible input: ${input.tagName} with placeholder: ${input.placeholder}`);
                    return input.tagName.toLowerCase();
                }
            }

            return null;
        });

        if (inputFound) {
            console.log(`✅ Chat input found: ${inputFound}`);

            // Type test message
            console.log('\n💬 Sending agent trigger message...');
            await page.focus(inputFound);
            await page.type(inputFound, 'Erstelle ein Bild von einem Löwen');

            // Send message (try Enter and button)
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Also try to find and click send button
            await page.evaluate(() => {
                const sendButton = Array.from(document.querySelectorAll('button')).find(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    return text.includes('send') || text.includes('senden') || btn.querySelector('ion-icon');
                });
                if (sendButton) {
                    console.log('Found send button, clicking...');
                    sendButton.click();
                }
            });

            // Wait for response
            console.log('\n⏳ Waiting for agent response...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Check for agent confirmation
            const agentTest = await page.evaluate(() => {
                const bodyText = document.body.innerText.toLowerCase();
                const hasAgentKeyword = bodyText.includes('agent');
                const hasConfirmation = bodyText.includes('starten') || bodyText.includes('start') ||
                                      bodyText.includes('ja,') || bodyText.includes('bestätigen');
                const hasLightBlueBackground = !!document.querySelector('[style*="background-color: #e0f7fa"], [style*="rgb(224, 247, 250)"]');

                return {
                    bodyText: bodyText.substring(0, 500),
                    hasAgentKeyword,
                    hasConfirmation,
                    hasLightBlueBackground,
                    agentConfirmationDetected: hasAgentKeyword && hasConfirmation
                };
            });

            console.log('\n📊 Agent Detection Results:');
            console.log(`Agent Keyword Found: ${agentTest.hasAgentKeyword ? '✅' : '❌'}`);
            console.log(`Confirmation Text Found: ${agentTest.hasConfirmation ? '✅' : '❌'}`);
            console.log(`Light Blue Background: ${agentTest.hasLightBlueBackground ? '✅' : '❌'}`);
            console.log(`Agent Confirmation Detected: ${agentTest.agentConfirmationDetected ? '✅' : '❌'}`);

            // Take final screenshot
            await page.screenshot({ path: 'final-test-step3-response.png', fullPage: true });

            // If agent confirmation found, try to click "Ja" button
            if (agentTest.agentConfirmationDetected) {
                console.log('\n🎉 Agent confirmation detected! Testing button click...');

                const buttonClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const jaButton = buttons.find(btn => {
                        const text = btn.textContent?.toLowerCase() || '';
                        return text.includes('ja') || text.includes('start');
                    });

                    if (jaButton) {
                        console.log('Clicking "Ja" button...');
                        jaButton.click();
                        return true;
                    }
                    return false;
                });

                if (buttonClicked) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await page.screenshot({ path: 'final-test-step4-execution.png', fullPage: true });
                    console.log('✅ Agent execution initiated');
                }
            }

            return {
                success: true,
                renderHealthy: renderIssues === 0,
                chatInputFound: true,
                agentTriggered: agentTest.agentConfirmationDetected,
                renderIssues: renderIssues,
                consoleMessages: {
                    agentConfirmation: agentConfirmationMessage,
                    agentStart: agentStartMessage
                }
            };

        } else {
            console.log('❌ No chat input found');
            return {
                success: false,
                renderHealthy: renderIssues === 0,
                chatInputFound: false,
                agentTriggered: false,
                renderIssues: renderIssues
            };
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
        return {
            success: false,
            error: error.message,
            renderHealthy: renderIssues === 0,
            renderIssues: renderIssues
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

finalAgentTest().then(result => {
    console.log('\n🎯 FINAL TEST SUMMARY');
    console.log('=====================================');
    console.log(`Overall Success: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Render Performance: ${result.renderHealthy ? '✅ HEALTHY' : '❌ ISSUES'} (${result.renderIssues || 0} issues)`);
    console.log(`Chat Interface: ${result.chatInputFound ? '✅ WORKING' : '❌ NOT FOUND'}`);
    console.log(`Agent Triggering: ${result.agentTriggered ? '✅ WORKING' : '❌ NOT WORKING'}`);

    if (result.consoleMessages) {
        console.log('\nConsole Message Detection:');
        console.log(`Agent Confirmation: ${result.consoleMessages.agentConfirmation ? '✅' : '❌'}`);
        console.log(`Agent Start: ${result.consoleMessages.agentStart ? '✅' : '❌'}`);
    }

    if (result.error) {
        console.log(`\nError: ${result.error}`);
    }

    console.log('\n📸 Screenshots saved:');
    console.log('- final-test-step1-home.png');
    console.log('- final-test-step2-chat.png');
    console.log('- final-test-step3-response.png');
    console.log('- final-test-step4-execution.png (if agent triggered)');
    console.log('\n=====================================');
});