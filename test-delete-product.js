// Simple test script to verify delete product functionality
// This can be run in the browser console when testing the admin products page

console.log('Testing Delete Product Functionality');

// Function to simulate delete button click
function testDeleteProduct() {
  const deleteButtons = document.querySelectorAll('.admin-delete-button');
  console.log(`Found ${deleteButtons.length} delete buttons`);
  
  if (deleteButtons.length > 0) {
    console.log('Delete buttons are present');
    console.log('First delete button text:', deleteButtons[0].textContent);
    console.log('First delete button disabled:', deleteButtons[0].disabled);
    
    // Check if buttons have proper event handlers
    const hasClickHandler = deleteButtons[0].onclick !== null;
    console.log('Has click handler:', hasClickHandler);
    
    return {
      buttonsFound: deleteButtons.length,
      firstButtonText: deleteButtons[0].textContent,
      firstButtonDisabled: deleteButtons[0].disabled,
      hasClickHandler
    };
  } else {
    console.log('No delete buttons found');
    return { error: 'No delete buttons found' };
  }
}

// Export for use in browser console
window.testDeleteProduct = testDeleteProduct;

console.log('Test function added to window.testDeleteProduct()');
console.log('You can now call testDeleteProduct() in the browser console');
