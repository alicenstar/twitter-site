document.addEventListener('DOMContentLoaded', () => {

    // Use nav to toggle between views
    document.querySelector('#profile').addEventListener('click', evt => load_profile(evt));
    document.querySelector('#all').addEventListener('click', () => load_posts('all'));
    document.querySelector('#following').addEventListener('click', () => load_posts('following'));

    // By default, load all posts
    load_posts('all');
});

function load_posts(param) {

    if (param === 'all') {
        var all_element = document.querySelector('#all-view');
        document.querySelector('#header').innerHTML = 'All Posts';

        // Display all posts view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        all_element.style.display = 'block';
        document.querySelector('#following-view').style.display = 'none';

        fetch(`/posts/${param}`)
        .then(response => response.json())
        .then(posts => posts.forEach(post => populate_posts(all_element, post)))
        .then(() => {
            let post_usernames = document.querySelectorAll('.username');
            post_usernames.forEach(username => {
                username.addEventListener('click', evt => load_profile(evt));
            });
        });
    }

    if (param === 'following') {
        var following_element = document.querySelector('#following-view');
        document.querySelector('#header').innerHTML = 'Following';

        // Display following view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        document.querySelector('#all-view').style.display = 'none';
        following_element.style.display = 'block';

        fetch(`/posts/${param}`)
        .then(response => response.json())
        .then(posts => posts.forEach(post => populate_posts(following_element, post)));
    }
}

function load_profile(evt) {

    var target_element = evt.target;
    var username = target_element.innerHTML;
    document.querySelector('#header').innerHTML = username;

    // Display user profile view and hide others
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'none';

    // Clear profile view before populating
    var profile_element = document.querySelector('#profile-body');
    profile_element.innerHTML = '';

    fetch(`/users/${username}`)
    .then(response => response.json())
    .then(data => {
        let profile = data.profile;
        let posts = data.posts;
        let is_following = false;

        profile.followers.forEach(follower => {
            if (data.current_user === follower.is_following_id) {
                is_following = true;
            }
        });
        if (is_following === true) {
            profile_element.innerHTML += `<button class="btn btn-primary follow" type="button">Unfollow</button>`;
        } else if ((profile.id != data.current_user) && is_following === false) {
            profile_element.innerHTML += `<button class="btn btn-primary follow" type="button">Follow</button>`;
        }

        // if (data.current_user in profile.followers)
        profile_element.innerHTML += `<p>Followers: ${profile.followers.length}</p>
            <p>Following: ${profile.following.length}</p>`;
        posts.forEach(post => populate_posts(profile_element, post));
    })
}

function populate_posts(element, post) {
    
    if (!post.num_likes) { post.num_likes = 0; }
    element.innerHTML += `<div class="post">
                <p class="username">${post.username}</p>
                <p class="timestamp">${post.timestamp}</p>
                <p class="content">${post.content}</p>
                <p class="likes">❤️ ${post.num_likes}</p>
                </div>`;
}