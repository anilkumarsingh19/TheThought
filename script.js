document.addEventListener('DOMContentLoaded', () => {
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

    postButton.addEventListener('click', () => {
        const thoughtText = thoughtInput.value.trim(); // .trim() removes whitespace from ends

        if (thoughtText === '') {
            alert("You can't post an empty thought!");
            return;
        }

        // Create the new thought element
        const newThought = createThoughtElement(thoughtText);

        // Add the new thought to the top of the timeline
        timeline.prepend(newThought);

        // Clear the textarea and reset the character counter
        thoughtInput.value = '';
        charCounter.textContent = maxLength;
    });

    /**
     * Creates a new thought post HTML element from text content.
     * In a real application, this data would come from a server.
     * @param {string} text - The content of the thought.
     * @returns {HTMLElement} - The new thought post element.
     */
    function createThoughtElement(text) {
        // Create the main container div
        const postDiv = document.createElement('div');
        postDiv.className = 'thought-post';

        // NOTE: In a real app, user data (username, avatar, etc.)
        // would come from the logged-in user's session.
        // Here, we're just using placeholder data.
        const randomId = Math.floor(Math.random() * 100);
        postDiv.innerHTML = `
            <div class="post-header">
                <img src="https://i.pravatar.cc/50?u=user${randomId}" alt="Avatar" class="avatar">
                <div class="user-info">
                    <span class="username">You</span>
                    <span class="handle">@current_user</span>
                </div>
            </div>
            <div class="post-body">
                <p>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p> </div>
            <div class="post-footer">
                <button class="action-button">Reply</button>
                <button class="action-button">Amplify</button>
                <button class="action-button">Resonate</button>
            </div>
        `;
        return postDiv;
    }
});
