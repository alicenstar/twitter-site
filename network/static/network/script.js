document.addEventListener('DOMContentLoaded', () => {

    // Use nav to toggle between views
    // Checks if elements exist (user is logged in)
    if (document.querySelector('#profile')) {
        document.querySelector('#profile').addEventListener('click', evt => load_profile(evt));
        document.querySelector('#following').addEventListener('click', () => load_posts('following'));
    }

    document.querySelector('#all').addEventListener('click', () => load_posts('all'));

    // By default, load all posts
    load_posts('all');
});

// Loads posts for 'All Posts' or 'Following' pages
function load_posts(post_parameter) {

    const all_element = document.querySelector('#all-view');
    const following_element = document.querySelector('#following-view');
    all_element.innerHTML = '';
    following_element.innerHTML = '';

    if (post_parameter === 'all') {
        var post_type = all_element;
        document.querySelector('#header').innerHTML = 'All Posts';
        // Display all posts view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        all_element.style.display = 'block';
        following_element.style.display = 'none';
    }

    if (post_parameter === 'following') {
        var post_type = following_element;
        document.querySelector('#header').innerHTML = 'Following';
        // Display following view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        all_element.style.display = 'none';
        following_element.style.display = 'block';
    }

    fetch(`/posts/${post_parameter}`)
    .then(response => response.json())
    .then(posts => posts.forEach(post => populate_posts(post_type, post)))
    .then(() => {
        // Add event listeners to username on each post 
        const post_usernames = document.querySelectorAll('.username');
        post_usernames.forEach(username => {
            username.addEventListener('click', evt => load_profile(evt));
        });
        // Add event listeners to like hearts on each post
        const like_hearts = document.querySelectorAll('.likes');
        like_hearts.forEach(heart => {
            heart.addEventListener('click', (evt) => adjust_likes(evt));
        });
    });
}

// Loads user profile
function load_profile(evt) {

    const target_element = evt.target;
    const username = target_element.innerHTML;
    document.querySelector('#header').innerHTML = username;

    // Display user profile view and hide others
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'none';

    // Clear profile view before populating
    const profile_element = document.querySelector('#profile-body');
    profile_element.innerHTML = '';

    fetch(`/users/${username}`)
    .then(response => response.json())
    .then(data => {
        const profile = data.profile;
        const posts = data.posts;
        var is_following = false;

        // If user is logged in, display follow/unfollow button
        if (document.querySelector('.follow')) {
            // Check if current user is in the profile user's followers
            profile.followers.forEach(follower => {
                if (data.current_user === follower.followed_by_id) {
                    is_following = true;
                }
            });
            const follow_button = document.querySelector('.follow');
            // If the profile is the logged in user's profile, don't show button
            if (data.current_user === profile.id) {
                follow_button.style.display = 'none';
            } else if (is_following === true) {
                follow_button.innerHTML = 'Unfollow';
                follow_button.addEventListener('click', () => adjust_follow(username));
            } else {
                follow_button.innerHTML = 'Follow';
                follow_button.addEventListener('click', () => adjust_follow(username));
            }
        }

        profile_element.innerHTML += `<div id="follow_counts">
                                    <p id="followers">Followers: ${profile.followers_count}</p>
                                    <p id="following">Following: ${profile.following_count}</p>
                                    </div>`;
        posts.forEach(post => populate_posts(profile_element, post));
    })
    .then(() => {
        // Add event listeners to username on each post 
        const post_usernames = document.querySelectorAll('.username');
        post_usernames.forEach(username => {
            username.addEventListener('click', evt => load_profile(evt));
        });
        // Add event listeners to like hearts on each post
        const like_hearts = document.querySelectorAll('.likes');
        like_hearts.forEach(heart => {
            heart.addEventListener('click', (evt) => adjust_likes(evt));
        });
    });
}

// Creates the post divs
function populate_posts(post_type, post) {
    
    if (!post.likes) { post.likes = 0 }
    post_type.innerHTML += `<div class="post">
                <p class="username">${post.username}</p>
                <p class="timestamp">${post.timestamp}</p>
                <p class="content">${post.content}</p>
                <p id="${post.id}" class="likes">❤️ ${post.likes}</p>
                </div>`;
}

function adjust_likes(evt) {

    const post_id = evt.target.id;
    fetch(`/likes/${post_id}`)
    .then(response => response.json())
    .then(post => {
        if (!post.likes) { post.likes = 0 }
        evt.target.innerHTML = `❤️ ${post.likes}`;
    });
}

function adjust_follow(username) {

    fetch(`/follow/${username}`)
    .then(response => response.json())
    .then(data => {
        const profile = data.profile;
        const follow_button = document.querySelector('.follow');
        const followers_element = document.querySelector('#followers');
        // Change what follow button says depending on if user is following
        if (data.status === true) {
            follow_button.innerHTML = 'Unfollow';
        } else {
            follow_button.innerHTML = 'Follow';
        }
        // Update number of followers
        followers_element.innerHTML = `<p>Followers: ${profile.followers_count}</p>`;
    });
}