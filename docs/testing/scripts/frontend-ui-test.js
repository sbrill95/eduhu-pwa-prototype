const puppeteer = require('puppeteer');

class FrontendUITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] ${message}`;
        console.log(logEntry);
        this.testResults.push(logEntry);
    }

    async initialize() {
        this.log('🚀 Initializing Puppeteer browser...', 'INIT');
        this.browser = await puppeteer.launch({
            headless: false, // Set to false to see the browser
            defaultViewport: { width: 375, height: 812 }, // iPhone X size
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();

        // Listen to console logs
        this.page.on('console', (msg) => {
            if (msg.text().includes('Agent') || msg.text().includes('Modal') || msg.text().includes('Error')) {
                this.log(`🔍 Browser Console: ${msg.text()}`, 'BROWSER');
            }
        });

        // Listen to page errors
        this.page.on('pageerror', (error) => {
            this.log(`❌ Page Error: ${error.message}`, 'ERROR');
        });
    }

    async testFrontendAvailability() {
        this.log('🌐 Testing Frontend Availability...', 'TEST');

        try {
            await this.page.goto('http://localhost:5193', { waitUntil: 'networkidle0', timeout: 10000 });

            const title = await this.page.title();
            this.log(`✅ Frontend loaded successfully: "${title}"`, 'SUCCESS');

            // Check if React app has loaded
            const reactElement = await this.page.$('#root');
            if (reactElement) {
                this.log('✅ React app root element found', 'SUCCESS');
            } else {
                this.log('❌ React app root element not found', 'ERROR');
            }

            return true;
        } catch (error) {
            this.log(`❌ Frontend not accessible: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async testAgentDetectionFlow() {
        this.log('🤖 Testing Agent Detection Flow...', 'TEST');

        try {
            // Wait for chat interface to load
            await this.page.waitForSelector('input[type="text"], textarea', { timeout: 5000 });
            this.log('✅ Chat input field found', 'SUCCESS');

            // Type a test message that should trigger agent detection
            const inputSelector = 'input[type="text"], textarea';
            await this.page.focus(inputSelector);
            await this.page.type(inputSelector, 'Erstelle ein Bild von einem Löwen');

            this.log('📝 Typed test message: "Erstelle ein Bild von einem Löwen"', 'INFO');

            // Submit the message
            await this.page.keyboard.press('Enter');
            this.log('⏎ Pressed Enter to submit message', 'INFO');

            // Wait for agent detection and modal
            await this.page.waitForTimeout(2000);

            // Check if agent modal appeared
            const modalExists = await this.page.$('[data-testid="agent-modal"], .agent-modal, [class*="modal"]') !== null;

            if (modalExists) {
                this.log('✅ Agent confirmation modal appeared', 'SUCCESS');

                // Take a screenshot of the modal
                await this.page.screenshot({ path: 'agent-modal-screenshot.png' });
                this.log('📸 Screenshot saved: agent-modal-screenshot.png', 'INFO');

                return true;
            } else {
                this.log('❌ Agent confirmation modal did not appear', 'ERROR');

                // Take a screenshot for debugging
                await this.page.screenshot({ path: 'no-modal-debug.png' });
                this.log('📸 Debug screenshot saved: no-modal-debug.png', 'INFO');

                return false;
            }

        } catch (error) {
            this.log(`❌ Agent detection flow failed: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async testModalFunctionality() {
        this.log('📋 Testing Modal Functionality...', 'TEST');

        try {
            // Check if modal is visible
            const modal = await this.page.$('[data-testid="agent-modal"], .agent-modal, [class*="modal"]');

            if (!modal) {
                this.log('❌ Modal not found for functionality test', 'ERROR');
                return false;
            }

            // Check for agent name/title
            const agentName = await this.page.$eval(
                modal,
                (el) => el.textContent || el.innerText
            );

            if (agentName.includes('Bildgenerierung') || agentName.includes('Bild')) {
                this.log('✅ Agent name displayed correctly in modal', 'SUCCESS');
            } else {
                this.log(`❌ Agent name not found in modal. Content: ${agentName.substring(0, 100)}...`, 'ERROR');
            }

            // Look for confirmation button
            const confirmButton = await this.page.$('button[data-testid="confirm-agent"], button:contains("Bestätigen"), button:contains("Ausführen")');

            if (confirmButton) {
                this.log('✅ Confirmation button found in modal', 'SUCCESS');
            } else {
                this.log('❌ Confirmation button not found in modal', 'ERROR');
            }

            // Look for cancel button
            const cancelButton = await this.page.$('button[data-testid="cancel-agent"], button:contains("Abbrechen")');

            if (cancelButton) {
                this.log('✅ Cancel button found in modal', 'SUCCESS');
            } else {
                this.log('❌ Cancel button not found in modal', 'ERROR');
            }

            return true;

        } catch (error) {
            this.log(`❌ Modal functionality test failed: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async testErrorHandling() {
        this.log('🛠️ Testing Error Handling...', 'TEST');

        try {
            // Type a message that should NOT trigger an agent
            const inputSelector = 'input[type="text"], textarea';
            await this.page.focus(inputSelector);
            await this.page.type(inputSelector, 'Wie ist das Wetter heute?');

            this.log('📝 Typed non-agent message: "Wie ist das Wetter heute?"', 'INFO');

            await this.page.keyboard.press('Enter');
            await this.page.waitForTimeout(2000);

            // Check that no modal appeared
            const modalExists = await this.page.$('[data-testid="agent-modal"], .agent-modal, [class*="modal"]') !== null;

            if (!modalExists) {
                this.log('✅ No agent modal for non-agent message (correct behavior)', 'SUCCESS');
                return true;
            } else {
                this.log('❌ Agent modal appeared for non-agent message (incorrect behavior)', 'ERROR');
                return false;
            }

        } catch (error) {
            this.log(`❌ Error handling test failed: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async runCompleteTest() {
        this.log('🚀 Starting Complete Frontend UI Test', 'START');
        this.log('='.repeat(60), 'SEPARATOR');

        try {
            // Initialize browser
            await this.initialize();

            // Test 1: Frontend Availability
            const frontendOk = await this.testFrontendAvailability();
            if (!frontendOk) {
                this.log('❌ Cannot continue - Frontend not available', 'FATAL');
                return this.generateReport();
            }

            // Test 2: Agent Detection Flow
            const agentDetectionOk = await this.testAgentDetectionFlow();

            // Test 3: Modal Functionality (if modal appeared)
            let modalFunctionalityOk = false;
            if (agentDetectionOk) {
                modalFunctionalityOk = await this.testModalFunctionality();
            }

            // Test 4: Error Handling
            const errorHandlingOk = await this.testErrorHandling();

            this.log('='.repeat(60), 'SEPARATOR');
            this.log('🏁 Complete Frontend UI Test Finished', 'FINISH');

            return this.generateReport();

        } catch (error) {
            this.log(`❌ Test suite failed: ${error.message}`, 'FATAL');
            return this.generateReport();
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            results: this.testResults,
            summary: {
                total_tests: this.testResults.filter(r => r.includes('[TEST]')).length,
                passed: this.testResults.filter(r => r.includes('✅')).length,
                failed: this.testResults.filter(r => r.includes('❌')).length
            }
        };

        console.log('\n' + '='.repeat(60));
        console.log('📋 FRONTEND UI TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${report.summary.total_tests}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${((report.summary.passed / (report.summary.passed + report.summary.failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        return report;
    }
}

// Check if Puppeteer is available
async function checkPuppeteerAvailability() {
    try {
        const puppeteer = require('puppeteer');
        console.log('✅ Puppeteer is available');
        return true;
    } catch (error) {
        console.log('❌ Puppeteer not available. Installing...');
        console.log('Run: npm install puppeteer');
        return false;
    }
}

// Run the test
async function runTest() {
    const isAvailable = await checkPuppeteerAvailability();
    if (!isAvailable) {
        return;
    }

    const tester = new FrontendUITester();
    try {
        const report = await tester.runCompleteTest();
        console.log('\n✅ Frontend UI Test completed. Check the output above for detailed results.');
    } catch (error) {
        console.error('❌ Frontend UI Test failed with error:', error);
    }
}

runTest();