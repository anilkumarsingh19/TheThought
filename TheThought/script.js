document.addEventListener('DOMContentLoaded', () => {
    // --- THEME TOGGLE ---
    const root = document.documentElement;
    // Default to light theme
    const storedTheme = localStorage.getItem('theme') || 'light';
    if (storedTheme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    
    // Update theme meta tag
            const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', storedTheme === 'light' ? '#f7f7f7' : '#121212');

    // --- CHARACTER COUNTER LOGIC ---
    const thoughtInput = document.getElementById('thought-input');
    const charCounter = document.getElementById('char-counter');
    const maxLength = thoughtInput.getAttribute('maxlength');

    thoughtInput.addEventListener('input', () => {
        const remaining = maxLength - thoughtInput.value.length;
        charCounter.textContent = remaining;
    });


    // --- POSTING A NEW THOUGHT LOGIC ---
    const postButton = document.getElementById('post-button');
    const timeline = document.getElementById('timeline');
    // Offline mode: no backend. Persist minimal state in localStorage.
    const STORAGE_KEYS = {
        thoughts: 'tt_thoughts',
        messages: 'tt_messages',
        profile: 'tt_profile',
        reels: 'tt_reels',
        searchHistory: 'tt_search_history'
    };
    const state = {
        thoughts: JSON.parse(localStorage.getItem(STORAGE_KEYS.thoughts) || '[]'),
        messages: JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]'),
        profile: JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}'),
        reels: JSON.parse(localStorage.getItem(STORAGE_KEYS.reels) || '[]'),
        searchHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.searchHistory) || '[]')
    };

    postButton.addEventListener('click', async () => {
        const thoughtText = thoughtInput.value.trim();
        if (thoughtText === '') {
            alert("You can't post an empty thought!");
            return;
        }
        const created = {
            id: Date.now(),
            author_id: 1,
            username: state.profile.display_name || 'You',
            handle: '@you',
            text: thoughtText,
            avatarSeed: 1,
            likes: 0,
            reshares: 0
        };
        state.thoughts.unshift(created);
        localStorage.setItem(STORAGE_KEYS.thoughts, JSON.stringify(state.thoughts));
        const newThought = createThoughtElement(created);
        timeline.prepend(newThought);
        thoughtInput.value = '';
        charCounter.textContent = maxLength;
    });

    function ensureBadge(button) {
        let badge = button.querySelector('.badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = '0';
            button.appendChild(badge);
        }
        return badge;
    }

    // --- Event delegation for reply / like / reshare ---
    timeline.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const post = e.target.closest('.thought-post');
        if (!post) return;
        const thoughtId = post.getAttribute('data-thought-id');

        if (target.classList.contains('btn-reply')) {
            const reply = prompt('Reply to this thought:');
            if (reply && reply.trim().length) {
                const replyEl = createThoughtElement(reply.trim());
                post.after(replyEl);
            }
            return;
        }

        if (target.classList.contains('btn-like')) {
            const badge = ensureBadge(target);
            let count = parseInt(badge.textContent || '0', 10);
            const isActive = target.classList.toggle('active-like');
            count = isActive ? count + 1 : Math.max(0, count - 1);
            badge.textContent = String(count);
            // persist
            const idx = state.thoughts.findIndex(t => String(t.id) === String(thoughtId));
            if (idx >= 0) {
                state.thoughts[idx].likes = count;
                localStorage.setItem(STORAGE_KEYS.thoughts, JSON.stringify(state.thoughts));
            }
            return;
        }

        if (target.classList.contains('btn-reshare')) {
            const badge = ensureBadge(target);
            let count = parseInt(badge.textContent || '0', 10);
            const isActive = target.classList.toggle('active-reshare');
            count = isActive ? count + 1 : Math.max(0, count - 1);
            badge.textContent = String(count);
            const idx = state.thoughts.findIndex(t => String(t.id) === String(thoughtId));
            if (idx >= 0) {
                state.thoughts[idx].reshares = count;
                localStorage.setItem(STORAGE_KEYS.thoughts, JSON.stringify(state.thoughts));
            }
            return;
        }
    });

    /**
     * Creates a new thought post HTML element from text content.
     * In a real application, this data would come from a server.
     * @param {object} data - The thought data.
     * @returns {HTMLElement} - The new thought post element.
     */
    function createThoughtElement(data) {
        // Create the main container div
        const postDiv = document.createElement('div');
        postDiv.className = 'thought-post';
        postDiv.setAttribute('data-thought-id', String(data.id));

        // NOTE: In a real app, user data (username, avatar, etc.)
        // would come from the logged-in user's session.
        // Here, we're just using placeholder data.
        const randomId = data.avatarSeed ?? Math.floor(Math.random() * 100);
        postDiv.innerHTML = `
            <div class="post-header">
                <img src="https://i.pravatar.cc/50?u=user${randomId}" alt="Avatar" class="avatar">
                <div class="user-info">
                    <span class="username">${data.username || 'User'}</span>
                    <span class="handle">${data.handle || '@user'}</span>
                </div>
            </div>
            <div class="post-body">
                <p>${String(data.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p> </div>
            <div class="post-footer">
                <button class="action-button btn-reply">Reply</button>
                <button class="action-button btn-like">Like <span class="badge">${data.likes || 0}</span></button>
                <button class="action-button btn-reshare">Reshare <span class="badge">${data.reshares || 0}</span></button>
            </div>
        `;
        return postDiv;
    }

    // --- Load feed from backend on startup ---
    (async function loadFeed() {
        timeline.innerHTML = '';
        state.thoughts.forEach(item => {
            const el = createThoughtElement(item);
            timeline.appendChild(el);
        });
    })();

    // --- Tabs logic ---
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            panels.forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));
            
            if (target === 'search') {
                loadSearch();
            }
            if (target === 'reels') {
                loadReels();
            }
            if (target === 'profile') {
                loadProfile();
            }
            if (target === 'messages') {
                loadMessages();
            }
        });
    });

    // --- Search Functionality ---
    async function loadSearch() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const searchResults = document.getElementById('search-results');
        
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        
        function performSearch() {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) return;
            
            // Add to search history
            if (!state.searchHistory.includes(query)) {
                state.searchHistory.unshift(query);
                state.searchHistory = state.searchHistory.slice(0, 10); // Keep only last 10
                localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(state.searchHistory));
            }
            
            // Search through thoughts and reels
            const results = [];
            
            // Search thoughts
            state.thoughts.forEach(thought => {
                if (thought.text.toLowerCase().includes(query) || 
                    thought.username.toLowerCase().includes(query)) {
                    results.push({
                        type: 'thought',
                        data: thought,
                        relevance: thought.text.toLowerCase().includes(query) ? 2 : 1
                    });
                }
            });
            
            // Search reels
            state.reels.forEach(reel => {
                if (reel.caption.toLowerCase().includes(query) || 
                    reel.username.toLowerCase().includes(query)) {
                    results.push({
                        type: 'reel',
                        data: reel,
                        relevance: reel.caption.toLowerCase().includes(query) ? 2 : 1
                    });
                }
            });
            
            // Sort by relevance
            results.sort((a, b) => b.relevance - a.relevance);
            
            // Display results
            searchResults.innerHTML = '';
            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-result"><p>No results found.</p></div>';
                return;
            }
            
            results.forEach(result => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'search-result';
                
                if (result.type === 'thought') {
                    resultDiv.innerHTML = `
                        <div class="post-header">
                            <img src="https://i.pravatar.cc/50?u=user${result.data.avatarSeed}" alt="Avatar" class="avatar">
                            <div class="user-info">
                                <span class="username">${result.data.username}</span>
                                <span class="handle">${result.data.handle}</span>
                            </div>
                        </div>
                        <div class="post-body">
                            <p>${result.data.text}</p>
                        </div>
                    `;
                } else if (result.type === 'reel') {
                    resultDiv.innerHTML = `
                        <div class="post-header">
                            <img src="https://i.pravatar.cc/50?u=user${result.data.avatarSeed}" alt="Avatar" class="avatar">
                            <div class="user-info">
                                <span class="username">${result.data.username}</span>
                                <span class="handle">${result.data.handle}</span>
                            </div>
                        </div>
                        <div class="post-body">
                            <video class="reel-video" controls>
                                <source src="${result.data.videoUrl}" type="video/mp4">
                            </video>
                            <p>${result.data.caption}</p>
                        </div>
                    `;
                }
                
                searchResults.appendChild(resultDiv);
            });
        }
    }

    // --- Reels Functionality ---
    async function loadReels() {
        const reelUpload = document.getElementById('reel-upload');
        const uploadArea = document.querySelector('.upload-area');
        const reelForm = document.querySelector('.reel-form');
        const postReelBtn = document.getElementById('post-reel');
        const reelsFeed = document.getElementById('reels-feed');
        
        // Handle file upload
        reelUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                reelForm.style.display = 'block';
                reelForm.dataset.videoUrl = url;
            }
        });
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            reelUpload.click();
        });
        
        // Post reel
        postReelBtn.addEventListener('click', () => {
            const caption = document.getElementById('reel-caption').value.trim();
            const videoUrl = reelForm.dataset.videoUrl;
            
            if (!videoUrl) {
                alert('Please select a video first!');
                return;
            }
            
            const newReel = {
                id: Date.now(),
                username: state.profile.display_name || 'You',
                handle: '@you',
                caption: caption || 'No caption',
                videoUrl: videoUrl,
                avatarSeed: 1,
                likes: 0,
                comments: 0,
                timestamp: new Date().toISOString()
            };
            
            state.reels.unshift(newReel);
            localStorage.setItem(STORAGE_KEYS.reels, JSON.stringify(state.reels));
            
            // Reset form
            reelUpload.value = '';
            document.getElementById('reel-caption').value = '';
            reelForm.style.display = 'none';
            delete reelForm.dataset.videoUrl;
            
            // Refresh feed
            displayReels();
        });
        
        // Display reels
        function displayReels() {
            reelsFeed.innerHTML = '';
            state.reels.forEach(reel => {
                const reelDiv = document.createElement('div');
                reelDiv.className = 'reel-item';
                reelDiv.innerHTML = `
                    <div class="post-header">
                        <img src="https://i.pravatar.cc/50?u=user${reel.avatarSeed}" alt="Avatar" class="avatar">
                        <div class="user-info">
                            <span class="username">${reel.username}</span>
                            <span class="handle">${reel.handle}</span>
                        </div>
                    </div>
                    <video class="reel-video" controls>
                        <source src="${reel.videoUrl}" type="video/mp4">
                    </video>
                    <div class="post-body">
                        <p>${reel.caption}</p>
                    </div>
                    <div class="post-footer">
                        <button class="action-button btn-like">❤️ ${reel.likes}</button>
                        <button class="action-button btn-comment">💬 ${reel.comments}</button>
                        <button class="action-button btn-share">📤 Share</button>
                    </div>
                `;
                reelsFeed.appendChild(reelDiv);
            });
        }
        
        displayReels();
    }

    // --- Profile ---
    async function loadProfile() {
        const me = state.profile || {};
        
        // Update profile display
        document.getElementById('profile-name').textContent = me.display_name || 'Your Name';
        document.getElementById('profile-username-display').textContent = '@' + (me.username || 'username');
        document.getElementById('profile-bio-display').textContent = me.bio || 'Your bio goes here...';
        
        // Update profile picture
        if (me.profilePic) {
            document.getElementById('profile-pic').src = me.profilePic;
        }
        
        // Update stats
        document.getElementById('posts-count').textContent = state.thoughts.length + state.reels.length;
        document.getElementById('followers-count').textContent = me.followers || 0;
        document.getElementById('following-count').textContent = me.following || 0;
        
        // Display user posts
        displayUserPosts();
        
        // Profile picture change
        const changePicBtn = document.getElementById('change-profile-pic');
        const profilePicInput = document.getElementById('profile-pic-input');
        
        changePicBtn.addEventListener('click', () => {
            profilePicInput.click();
        });
        
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const profilePic = document.getElementById('profile-pic');
                    profilePic.src = e.target.result;
                    
                    // Save to state
                    state.profile.profilePic = e.target.result;
                    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Edit profile modal
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const editProfileModal = document.getElementById('edit-profile-modal');
        const saveProfileChangesBtn = document.getElementById('save-profile-changes');
        const cancelEditProfileBtn = document.getElementById('cancel-edit-profile');
        
        editProfileBtn.addEventListener('click', () => {
            // Populate form with current data
            document.getElementById('edit-display-name').value = me.display_name || '';
            document.getElementById('edit-username').value = me.username || '';
            document.getElementById('edit-bio').value = me.bio || '';
            editProfileModal.style.display = 'flex';
        });
        
        saveProfileChangesBtn.addEventListener('click', () => {
            const payload = {
                display_name: document.getElementById('edit-display-name').value,
                username: document.getElementById('edit-username').value,
                bio: document.getElementById('edit-bio').value,
            };
            state.profile = Object.assign({}, state.profile, payload);
            localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
            
            // Update display
            loadProfile();
            editProfileModal.style.display = 'none';
        });
        
        cancelEditProfileBtn.addEventListener('click', () => {
            editProfileModal.style.display = 'none';
        });
        
        // Settings modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsBtn = document.getElementById('close-settings');
        
        settingsBtn.addEventListener('click', () => {
            // Set current theme
            const currentTheme = localStorage.getItem('theme') || 'light';
            document.querySelectorAll('.theme-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === currentTheme);
            });
            
            // Set current privacy
            const currentPrivacy = state.profile.privacy || 'public';
            document.querySelector(`input[name="privacy"][value="${currentPrivacy}"]`).checked = true;
            
            settingsModal.style.display = 'flex';
        });
        
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
        
        // Theme options
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                root.classList.toggle('light', theme === 'light');
                localStorage.setItem('theme', theme);
                
                // Update meta theme color
                const metaTheme = document.querySelector('meta[name="theme-color"]');
                if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#f7f7f7' : '#121212');
                
                // Update active state
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Privacy options
        document.querySelectorAll('input[name="privacy"]').forEach(radio => {
            radio.addEventListener('change', () => {
                state.profile.privacy = radio.value;
                localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
            });
        });
        
        // Account options
        document.getElementById('blocked-users-btn').addEventListener('click', () => {
            alert('Blocked users feature coming soon!');
        });
        
        document.getElementById('help-btn').addEventListener('click', () => {
            alert('Help: This is a demo social media app. All data is stored locally in your browser.');
        });
        
        document.getElementById('about-btn').addEventListener('click', () => {
            alert('TheThought v1.0\nA simple social media platform for sharing thoughts and short videos.\nBuilt with HTML, CSS, and JavaScript.');
        });
        
        // Close modals when clicking outside
        [editProfileModal, settingsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    function displayUserPosts() {
        const userPosts = document.getElementById('user-posts');
        userPosts.innerHTML = '';
        
        // Combine thoughts and reels
        const allPosts = [
            ...state.thoughts.map(t => ({...t, type: 'thought'})),
            ...state.reels.map(r => ({...r, type: 'reel'}))
        ].sort((a, b) => b.id - a.id);
        
        allPosts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.className = 'post-item';
            
            if (post.type === 'thought') {
                postDiv.innerHTML = `
                    <p><strong>Thought:</strong></p>
                    <p>${post.text.substring(0, 100)}${post.text.length > 100 ? '...' : ''}</p>
                    <small>❤️ ${post.likes} | 🔄 ${post.reshares}</small>
                `;
            } else {
                postDiv.innerHTML = `
                    <p><strong>Reel:</strong></p>
                    <p>${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}</p>
                    <small>❤️ ${post.likes} | 💬 ${post.comments}</small>
                `;
            }
            
            userPosts.appendChild(postDiv);
        });
    }

    // --- Messages ---
    async function loadMessages() {
        const list = document.getElementById('messages-list');
        list.innerHTML = '';
        if (!state.messages.length) {
            list.innerHTML = '<div class="post-body"><p>No messages yet.</p></div>';
            return;
        }
        state.messages.slice().reverse().forEach(m => {
            const wrap = document.createElement('div');
            wrap.className = 'thought-post';
            wrap.innerHTML = `<div class="post-body"><p><strong>To ${m.recipient_id}:</strong> ${m.text}</p></div>`;
            list.appendChild(wrap);
        });
    }
    const sendBtn = document.getElementById('send-message');
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const to = parseInt(document.getElementById('msg-to').value || '0', 10);
            const text = document.getElementById('msg-text').value.trim();
            if (!to || !text) { alert('Enter recipient and message'); return; }
            state.messages.push({ id: Date.now(), sender_id: 1, recipient_id: to, text });
            localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(state.messages));
            document.getElementById('msg-text').value = '';
            loadMessages();
        });
    }
});
