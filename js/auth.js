(function () {
    // skip auth check on the login page itself
    const path = window.location.pathname;
    if (path === '/login' || path === '/') return;

    // redirect to login if not authenticated
    if (!sessionStorage.getItem('loggedIn')) {
        window.location.replace('/login');
        return;
    }

    // inject logout button into topbar
    function injectLogout() {
        const topbarLeft = document.querySelector('.topbar-left');
        if (!topbarLeft || document.getElementById('logoutBtn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'logoutBtn';
        btn.className = 'logout-btn';
        btn.textContent = 'יציאה';
        btn.addEventListener('click', () => {
            sessionStorage.removeItem('loggedIn');
            window.location.href = '/login';
        });
        topbarLeft.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLogout);
    } else {
        injectLogout();
    }
})();
