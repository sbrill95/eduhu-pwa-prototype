// Test script to verify AgentConfirmationModal functionality
// Run this in browser console after navigating to http://localhost:5175

console.log('🔍 Starting AgentConfirmationModal test...');

// Test 1: Check if React components are loaded
const checkReactComponents = () => {
  console.log('Test 1: Checking React components...');
  const reactRoot = document.getElementById('root');
  if (reactRoot) {
    console.log('✅ React root found');
    const content = reactRoot.innerHTML;
    if (content.includes('ion-') || content.includes('Starten Sie Ihr Gespräch')) {
      console.log('✅ Ionic components detected');
      return true;
    } else {
      console.log('❌ No Ionic components found');
      return false;
    }
  } else {
    console.log('❌ React root not found');
    return false;
  }
};

// Test 2: Check for agent confirmation modal in DOM
const checkModalInDOM = () => {
  console.log('Test 2: Checking for modal elements...');
  const modals = document.querySelectorAll('ion-modal');
  console.log(`Found ${modals.length} ion-modal elements`);

  const agentModal = document.querySelector('ion-modal.agent-confirmation-modal');
  if (agentModal) {
    console.log('✅ Agent confirmation modal found in DOM');
    console.log('Modal visibility:', window.getComputedStyle(agentModal).display);
    console.log('Modal open attribute:', agentModal.getAttribute('is-open'));
    return true;
  } else {
    console.log('❌ Agent confirmation modal not found in DOM');
    return false;
  }
};

// Test 3: Check for button elements
const checkModalButtons = () => {
  console.log('Test 3: Checking for modal buttons...');
  const buttons = document.querySelectorAll('.agent-modal-buttons ion-button');
  console.log(`Found ${buttons.length} buttons in agent modal`);

  buttons.forEach((button, index) => {
    const text = button.textContent || button.innerText;
    const isVisible = window.getComputedStyle(button).display !== 'none';
    const isClickable = !button.disabled;
    console.log(`Button ${index + 1}: "${text.trim()}" - Visible: ${isVisible}, Clickable: ${isClickable}`);
  });

  return buttons.length >= 2;
};

// Test 4: Simulate modal trigger
const simulateModalTrigger = () => {
  console.log('Test 4: Attempting to trigger modal...');
  const input = document.querySelector('ion-input input');
  if (input) {
    console.log('✅ Found input field');
    // Set the value and trigger events
    input.value = 'erstelle ein bild von einem löwen';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Try to find and click submit button
    const submitButton = document.querySelector('ion-button[type="submit"]');
    if (submitButton) {
      console.log('✅ Found submit button, clicking...');
      submitButton.click();
      return true;
    } else {
      console.log('❌ Submit button not found');
      return false;
    }
  } else {
    console.log('❌ Input field not found');
    return false;
  }
};

// Run all tests
const runTests = () => {
  console.log('🚀 Running AgentConfirmationModal tests...');

  const results = {
    reactComponents: checkReactComponents(),
    modalInDOM: checkModalInDOM(),
    modalButtons: checkModalButtons(),
  };

  console.log('📊 Test Results:', results);

  if (results.reactComponents) {
    console.log('✅ Basic React setup is working');

    setTimeout(() => {
      console.log('⏱️ Attempting to trigger modal in 2 seconds...');
      simulateModalTrigger();

      // Check modal state after trigger
      setTimeout(() => {
        console.log('🔍 Checking modal state after trigger...');
        checkModalInDOM();
        checkModalButtons();
      }, 1000);
    }, 2000);
  } else {
    console.log('❌ Basic React setup failed - cannot proceed with modal tests');
  }
};

// Helper function to manually show debug info
const debugModalState = () => {
  console.log('🔍 Manual modal debug info:');

  // Check all modals
  const allModals = document.querySelectorAll('ion-modal');
  console.log(`Total modals in DOM: ${allModals.length}`);

  // Check agent modal specifically
  const agentModal = document.querySelector('ion-modal.agent-confirmation-modal');
  if (agentModal) {
    console.log('Agent modal found:');
    console.log('- is-open attribute:', agentModal.getAttribute('is-open'));
    console.log('- style display:', window.getComputedStyle(agentModal).display);
    console.log('- style visibility:', window.getComputedStyle(agentModal).visibility);
    console.log('- style z-index:', window.getComputedStyle(agentModal).zIndex);

    // Check modal content
    const content = agentModal.querySelector('ion-content');
    if (content) {
      console.log('Modal content found');
      const buttons = content.querySelectorAll('.agent-modal-buttons ion-button');
      console.log(`Buttons in content: ${buttons.length}`);

      buttons.forEach((btn, i) => {
        console.log(`Button ${i + 1}:`, {
          text: btn.textContent?.trim(),
          display: window.getComputedStyle(btn).display,
          visibility: window.getComputedStyle(btn).visibility,
          disabled: btn.disabled
        });
      });
    } else {
      console.log('❌ No modal content found');
    }
  } else {
    console.log('❌ Agent modal not found');
  }
};

// Export functions to global scope for manual testing
window.debugModalState = debugModalState;
window.runModalTests = runTests;

// Auto-run tests when script loads
runTests();

console.log('📋 Manual testing commands available:');
console.log('- runModalTests() - Run all tests again');
console.log('- debugModalState() - Show detailed modal state');