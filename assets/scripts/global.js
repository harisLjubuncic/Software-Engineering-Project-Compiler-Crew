document.addEventListener('DOMContentLoaded', function () {
    const authButton = document.getElementById('authButton');
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    if (token) {
        authButton.id = 'logoutButton';
        authButton.textContent = 'Logout';
        authButton.href = '#';
        authButton.addEventListener('click', function () {
            // Remove the token from cookies
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            // Redirect to the main page
            window.location.href = '/';
            alert('Logged out successfully');
        });
    } else {
        authButton.textContent = 'Login';
        authButton.href = '/login';
    }
});