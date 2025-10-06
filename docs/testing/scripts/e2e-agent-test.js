const https = require('https');
const http = require('http');

// Test Configuration
const BACKEND_URL = 'http://localhost:3006';
const FRONTEND_URL = 'http://localhost:5193';

class AgentSystemTester {
    constructor() {
        this.testResults = [];
        this.backend_port = 3001;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] ${message}`;
        console.log(logEntry);
        this.testResults.push(logEntry);
    }

    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = http.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            status: res.statusCode,
                            data: parsed,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: responseData,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async testBackendAvailability() {
        this.log('🚀 Testing Backend Availability...', 'TEST');
        try {
            const response = await this.makeRequest(`${BACKEND_URL}/api/health`);
            if (response.status === 200) {
                this.log('✅ Backend is running and healthy', 'SUCCESS');
                return true;
            } else {
                this.log(`❌ Backend health check failed: ${response.status}`, 'ERROR');
                return false;
            }
        } catch (error) {
            this.log(`❌ Backend not reachable: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async testAgentAvailableEndpoint() {
        this.log('🤖 Testing Agent Available Endpoint...', 'TEST');
        try {
            const response = await this.makeRequest(`${BACKEND_URL}/api/langgraph-agents/available`);

            if (response.status === 200) {
                this.log('✅ Agent Available endpoint accessible', 'SUCCESS');

                if (Array.isArray(response.data)) {
                    this.log(`📊 Found ${response.data.length} available agents:`, 'INFO');
                    response.data.forEach(agent => {
                        this.log(`   - ${agent.name} (${agent.id}): ${agent.description}`, 'INFO');
                    });
                    return response.data;
                } else {
                    this.log('❌ Response is not an array', 'ERROR');
                    return null;
                }
            } else {
                this.log(`❌ Agent Available endpoint failed: ${response.status}`, 'ERROR');
                return null;
            }
        } catch (error) {
            this.log(`❌ Agent Available endpoint error: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async testAgentDetection() {
        this.log('🔍 Testing Agent Detection Logic via Frontend...', 'TEST');

        // Agent detection is done on frontend, so we test available agents instead
        const testPhrases = [
            "Erstelle ein Bild von einem Löwen",
            "Ich brauche eine Illustration für Mathematik",
            "Mach mir ein Arbeitsblatt mit einem Diagramm",
            "Wie ist das Wetter?" // Should NOT trigger agent
        ];

        const results = [];

        // Test if agents endpoint works first
        try {
            const agentsResponse = await this.makeRequest(`${BACKEND_URL}/api/langgraph-agents/available`);
            if (agentsResponse.status === 200) {
                this.log(`✅ Available agents endpoint working`, 'SUCCESS');
                this.log(`📊 Found ${agentsResponse.data.data.total_count} agents`, 'INFO');

                agentsResponse.data.data.agents.forEach(agent => {
                    this.log(`   - ${agent.name} (${agent.id}): ${agent.description}`, 'INFO');
                });

                // Simulate detection logic based on keywords
                for (const phrase of testPhrases) {
                    const detected = this.detectAgentFromPhrase(phrase, agentsResponse.data.data.agents);
                    this.log(`📝 "${phrase}" -> Agent detected: ${detected ? detected.name : 'none'}`, 'INFO');
                    results.push({ phrase, detected: !!detected, agent: detected });
                }

            } else {
                this.log(`❌ Available agents endpoint failed: ${agentsResponse.status}`, 'ERROR');
            }
        } catch (error) {
            this.log(`❌ Agent detection test error: ${error.message}`, 'ERROR');
        }

        return results;
    }

    detectAgentFromPhrase(phrase, agents) {
        const lowerPhrase = phrase.toLowerCase();

        // Simple keyword detection logic
        if (lowerPhrase.includes('bild') || lowerPhrase.includes('illustration') ||
            lowerPhrase.includes('diagramm') || lowerPhrase.includes('erstelle')) {
            return agents.find(agent => agent.id.includes('image') || agent.type === 'image-generation');
        }

        return null;
    }

    async testImageGenerationEndpoint() {
        this.log('🎨 Testing Image Generation Endpoint...', 'TEST');

        const testData = {
            prompt: "Ein freundlicher Löwe als Cartoon-Figur für Kinder",
            confirmExecution: true,
            agentId: "langgraph-image-generation",
            userId: "test-user-123",
            size: "1024x1024",
            quality: "standard"
        };

        try {
            this.log('📤 Sending image generation request...', 'INFO');
            const response = await this.makeRequest(
                `${BACKEND_URL}/api/langgraph-agents/image/generate`,
                'POST',
                testData
            );

            if (response.status === 200) {
                this.log('✅ Image generation endpoint accessible', 'SUCCESS');

                if (response.data.success) {
                    this.log(`🖼️ Image generated successfully: ${response.data.image_url}`, 'SUCCESS');
                    this.log(`📊 Generation details: ${JSON.stringify(response.data.metadata)}`, 'INFO');
                    return true;
                } else {
                    this.log(`❌ Image generation failed: ${response.data.error}`, 'ERROR');
                    return false;
                }
            } else {
                this.log(`❌ Image generation endpoint failed: ${response.status}`, 'ERROR');
                this.log(`Response: ${JSON.stringify(response.data)}`, 'ERROR');
                return false;
            }
        } catch (error) {
            this.log(`❌ Image generation error: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async testFrontendAvailability() {
        this.log('🌐 Testing Frontend Availability...', 'TEST');
        try {
            const response = await this.makeRequest(FRONTEND_URL);
            if (response.status === 200) {
                this.log('✅ Frontend is accessible', 'SUCCESS');
                return true;
            } else {
                this.log(`❌ Frontend not accessible: ${response.status}`, 'ERROR');
                return false;
            }
        } catch (error) {
            this.log(`❌ Frontend not reachable: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async runCompleteTest() {
        this.log('🚀 Starting Complete Agent System E2E Test', 'START');
        this.log('='.repeat(60), 'SEPARATOR');

        // 1. Backend Availability
        const backendOk = await this.testBackendAvailability();
        if (!backendOk) {
            this.log('❌ Cannot continue - Backend not available', 'FATAL');
            return this.generateReport();
        }

        // 2. Frontend Availability
        const frontendOk = await this.testFrontendAvailability();

        // 3. Agent Available Endpoint
        const availableAgents = await this.testAgentAvailableEndpoint();

        // 4. Agent Detection
        const detectionResults = await this.testAgentDetection();

        // 5. Image Generation Test
        const imageGenerationOk = await this.testImageGenerationEndpoint();

        this.log('='.repeat(60), 'SEPARATOR');
        this.log('🏁 Complete Agent System E2E Test Finished', 'FINISH');

        return this.generateReport();
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
        console.log('📋 TEST SUMMARY REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${report.summary.total_tests}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${((report.summary.passed / (report.summary.passed + report.summary.failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        return report;
    }
}

// Run the test
const tester = new AgentSystemTester();
tester.runCompleteTest().then(report => {
    console.log('\n✅ E2E Test completed. Check the output above for detailed results.');
}).catch(error => {
    console.error('❌ E2E Test failed with error:', error);
});