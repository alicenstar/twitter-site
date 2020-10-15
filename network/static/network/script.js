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
function load_posts(param) {

    const all_element = document.querySelector('#all-view');
    const following_element = document.querySelector('#following-view');
    all_element.innerHTML = '';
    following_element.innerHTML = '';

    if (param === 'all') {
        var post_type = all_element;
        document.querySelector('#header').innerHTML = 'All Posts';
        // Display all posts view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        all_element.style.display = 'block';
        following_element.style.display = 'none';
    }

    if (param === 'following') {
        var post_type = following_element;
        document.querySelector('#header').innerHTML = 'Following';
        // Display following view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        all_element.style.display = 'none';
        following_element.style.display = 'block';
    }

    fetch(`/posts/${param}`)
    .then(response => response.json())
    .then(posts => posts.forEach(post => populate_posts(post_type, post)))
    .then(() => {
        // Add event listeners to username on each post 
        const post_usernames = document.querySelectorAll('.username');
        post_usernames.forEach(username => {
            username.addEventListener('click', evt => load_profile(evt));
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
                console.log(data.current_user);
                console.log(follower.followed_by_id);
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
            } else {
                follow_button.innerHTML = 'Follow';
            }
        }

        profile_element.innerHTML += `<p>Followers: ${profile.followers.length}</p>
                                    <p>Following: ${profile.following.length}</p>`;
        posts.forEach(post => populate_posts(profile_element, post));
    })
}

// Creates the post divs
function populate_posts(post_type, post) {
    
    if (!post.num_likes) { post.num_likes = 0 }
    post_type.innerHTML += `<div class="post">
                <p class="username">${post.username}</p>
                <p class="timestamp">${post.timestamp}</p>
                <p class="content">${post.content}</p>
                <p class="likes">❤️ ${post.num_likes}</p>
                </div>`;
}