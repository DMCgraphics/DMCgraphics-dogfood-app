// Test script to manually verify payment for stuck checkout sessions
// This will help debug why the verify-payment endpoint isn't working

const testSessionId = "cs_test_b1M8kX93QCcebSUEqWBb8sFQ8ZaT7Ntg2jaEg56CcjaHeBuX4fPou7ocnz";

console.log("Testing verify-payment for session:", testSessionId);

// This would need to be run from the frontend or with proper authentication
// The issue might be that the user is not authenticated when the success page loads
