// QA Test Script for Teacher Assistant App
// This script tests navigation, header greeting, and chat functionality

console.log('=== QA TEST SCRIPT FOR TEACHER ASSISTANT APP ===');

// Test 1: Navigation Functionality
function testNavigation() {
  console.log('\n1. TESTING NAVIGATION FUNCTIONALITY:');

  // Check if tab buttons exist
  const tabButtons = document.querySelectorAll('ion-tab-button');
  console.log(`Found ${tabButtons.length} tab buttons`);

  if (tabButtons.length >= 3) {
    const homeTab = tabButtons[0];
    const chatTab = tabButtons[1];
    const libraryTab = tabButtons[2];

    console.log('Tab button texts:', Array.from(tabButtons).map(btn => btn.textContent?.trim()));

    // Test click events
    console.log('Testing tab clicks...');

    // Click Chat tab
    chatTab.click();
    setTimeout(() => {
      const currentContent = document.querySelector('.content-with-tabs');
      console.log('After clicking Chat tab, content shows:', currentContent?.innerHTML?.includes('ChatView') ? 'ChatView' : 'Other content');
    }, 100);

    // Click Library tab
    setTimeout(() => {
      libraryTab.click();
      setTimeout(() => {
        const currentContent = document.querySelector('.content-with-tabs');
        console.log('After clicking Library tab, content shows:', currentContent?.innerHTML?.includes('Materialien') ? 'Library content' : 'Other content');
      }, 100);
    }, 200);

    // Click Home tab
    setTimeout(() => {
      homeTab.click();
      setTimeout(() => {
        const currentContent = document.querySelector('.content-with-tabs');
        console.log('After clicking Home tab, content shows:', currentContent?.innerHTML?.includes('Willkommen bei eduhu.app') ? 'Home content' : 'Other content');
      }, 100);
    }, 400);
  } else {
    console.log('ERROR: Expected 3 tab buttons, found', tabButtons.length);
  }
}

// Test 2: Header Greeting
function testHeaderGreeting() {
  console.log('\n2. TESTING HEADER GREETING:');

  const headerTitle = document.querySelector('ion-title');
  if (headerTitle) {
    const greetingText = headerTitle.textContent?.trim();
    console.log('Header greeting text:', greetingText);

    // Check for hardcoded problematic text
    if (greetingText?.includes('Willkommen zurück, s.brill')) {
      console.log('ERROR: Found hardcoded "Willkommen zurück, s.brill" in header');
    } else if (greetingText?.startsWith('Hallo')) {
      console.log('SUCCESS: Header shows personalized greeting');
    } else if (greetingText === 'eduhu.app') {
      console.log('SUCCESS: Header shows fallback app name');
    } else {
      console.log('WARNING: Unexpected header text format');
    }
  } else {
    console.log('ERROR: Header title not found');
  }
}

// Test 3: Chat Message Display
function testChatMessages() {
  console.log('\n3. TESTING CHAT MESSAGE DISPLAY:');

  // First navigate to chat tab
  const chatTab = document.querySelectorAll('ion-tab-button')[1];
  if (chatTab) {
    chatTab.click();

    setTimeout(() => {
      const messageContainers = document.querySelectorAll('ion-card');
      const chatMessages = Array.from(messageContainers).filter(card =>
        card.innerHTML.includes('eduhu tippt') ||
        card.closest('[style*="flex-end"]') ||
        card.closest('[style*="flex-start"]')
      );

      console.log(`Found ${chatMessages.length} chat message containers`);

      if (chatMessages.length > 0) {
        console.log('Checking message order...');
        chatMessages.forEach((msg, index) => {
          const timestamp = msg.querySelector('ion-text[color="light"], ion-text[color="medium"]');
          if (timestamp) {
            console.log(`Message ${index + 1}: ${timestamp.textContent?.trim()}`);
          }
        });
      } else {
        console.log('No chat messages found - checking for welcome screen');
        const welcomeText = document.querySelector('h2');
        if (welcomeText?.textContent?.includes('Willkommen')) {
          console.log('SUCCESS: Chat welcome screen displayed');
        }
      }
    }, 500);
  }
}

// Test 4: Mobile Responsiveness
function testMobileResponsiveness() {
  console.log('\n4. TESTING MOBILE RESPONSIVENESS:');

  const viewport = window.innerWidth;
  console.log(`Current viewport width: ${viewport}px`);

  // Check if viewport is mobile-friendly
  if (viewport >= 375) {
    console.log('SUCCESS: Viewport meets mobile minimum width (375px)');
  } else {
    console.log('WARNING: Viewport below mobile minimum width');
  }

  // Check for responsive design elements
  const tabBar = document.querySelector('ion-tab-bar');
  if (tabBar) {
    const tabBarStyle = getComputedStyle(tabBar);
    console.log('Tab bar position:', tabBarStyle.position);
    console.log('Tab bar display:', tabBarStyle.display);
  }
}

// Test 5: Console Error Check
function testConsoleErrors() {
  console.log('\n5. CHECKING FOR CONSOLE ERRORS:');

  // Store original console.error
  const originalError = console.error;
  let errorCount = 0;

  // Override console.error to track errors
  console.error = function(...args) {
    errorCount++;
    console.log(`ERROR ${errorCount}:`, ...args);
    originalError.apply(console, args);
  };

  setTimeout(() => {
    console.log(`Total console errors detected: ${errorCount}`);
    if (errorCount === 0) {
      console.log('SUCCESS: No console errors detected');
    } else {
      console.log('WARNING: Console errors found - check above');
    }

    // Restore original console.error
    console.error = originalError;
  }, 1000);
}

// Run all tests
function runAllTests() {
  console.log('Starting comprehensive QA test suite...');

  testHeaderGreeting();
  testNavigation();
  testChatMessages();
  testMobileResponsiveness();
  testConsoleErrors();

  console.log('\n=== QA TEST SUITE COMPLETED ===');
  console.log('Check the results above for any issues.');
}

// Auto-run tests when script loads
runAllTests();

// Export functions for manual testing
window.qaTests = {
  runAllTests,
  testNavigation,
  testHeaderGreeting,
  testChatMessages,
  testMobileResponsiveness,
  testConsoleErrors
};