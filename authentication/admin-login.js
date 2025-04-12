const supabaseClient = supabase.createClient(
    'https://lngdoqimxolarajflobo.supabase.co', // Your actual URL
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZ2RvcWlteG9sYXJhamZsb2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MjQ5MDQsImV4cCI6MjA2MDAwMDkwNH0.hDroH3E7cq-RHh8iGsbg5s1tdYVSHMI94ZSZXzoABic' // Replace with actual anon key from project settings > API
  );
  
  const loginBtn = document.querySelector('button');
  const usernameInput = document.querySelector('.username');
  const passwordInput = document.querySelector('.password');
  
  loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
  
    if (!username || !password) {
      displayNotification('Please fill in both fields!', 'error');
      return;
    }
  
    try {
      const { data, error } = await supabaseClient
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();
  
      if (error || !data) {
        displayNotification('Username not found!', 'error');
        return;
      }
  
      if (data.password !== password) {
        displayNotification('Incorrect password!', 'error');
        return;
      }
  
      // Store user info in localStorage after successful login
      localStorage.setItem('loggedInUser', JSON.stringify(data));  // Save the whole user object or just the username
  
      // Display success notification
      displayNotification(`Login successful! Welcome ${username}.`, 'success');
  
      // Redirect to dashboard after a short delay to allow user to see the notification
      setTimeout(() => {
        window.location.href = '../dashboard/dashboard.html';
      }, 2000);
    } catch (error) {
      displayNotification('Login failed: ' + error.message, 'error');
      console.log(error);
    }
  });
  
  // Function to show the notification with the appropriate message and type (success/error)
  function displayNotification(message, type) {
    const notification = document.getElementById('login-notification');
    notification.textContent = message;
    notification.classList.remove('success', 'error'); // Remove both classes before adding the new one
    notification.classList.add(type); // Add the appropriate type class (success or error)
    notification.classList.add('show'); // Show notification
  
    // Hide the notification after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }
  