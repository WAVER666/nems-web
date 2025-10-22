// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('login-error');
            
            try {
                // Sign in with Firebase Authentication
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Redirect to dashboard after successful login
                window.location.href = 'client-dashboard.html';
            } catch (error) {
                // Handle login errors
                if (errorElement) {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                }
            }
        });
    }

    // Handle password reset
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            if (!email) {
                alert('Please enter your email address first');
                return;
            }
            
            try {
                await firebase.auth().sendPasswordResetEmail(email);
                alert('Password reset email sent! Please check your inbox.');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        if (user && window.location.pathname.endsWith('client-portal.html')) {
            // If user is logged in and on login page, redirect to dashboard
            window.location.href = 'client-dashboard.html';
        } else if (!user && window.location.pathname.endsWith('client-dashboard.html')) {
            // If user is not logged in and on dashboard, redirect to login
            window.location.href = 'client-portal.html';
        }
    });
});