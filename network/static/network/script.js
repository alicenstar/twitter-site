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

    // Display all posts view and hide others
    document.querySelector('#profile-view').style.display = 'none';

    if (post_parameter === 'all') { document.querySelector('#header').innerHTML = 'All Posts' }
    if (post_parameter === 'following') {
        document.querySelector('#header').innerHTML = 'Following';
        document.querySelector('#new-post-form').style.display = 'none';
    }

    fetch(`/posts/${post_parameter}`)
    .then(response => response.json())
    .then(posts => paginate_posts( posts))
    .then(() => add_listeners());
}

// Loads user profile
function load_profile(evt) {

    const target_element = evt.target;
    const username = target_element.innerHTML;
    document.querySelector('#header').innerHTML = username;

    // Display user profile view and hide others
    document.querySelector('#profile-view').style.display = 'block';

    // Clear profile view before populating
    const follow_counts = document.querySelector('#follow-counts');

    fetch(`/users/${username}`)
    .then(response => response.json())
    .then(user_data => {
        const profile = user_data.profile;
        const posts = user_data.posts;
        
        follow_counts.innerHTML = `<p id="followers">Followers: ${profile.followers_count}</p>
                                    <p id="following">Following: ${profile.following_count}</p>`;
        follow_button_checks(user_data, username);
        paginate_posts(posts);
    })
    .then(() => add_listeners());
}

function follow_button_checks(user_data, username) {
    
    const profile = user_data.profile;
    var is_following = false;

    // If user is logged in, display follow/unfollow button
    if (document.querySelector('#follow-button')) {
        const follow_button = document.querySelector('#follow-button');

        // Check if current user is in the profile user's followers
        profile.followers.forEach(follower => {
            if (user_data.current_user === follower.followed_by_id) {
                is_following = true;
            }
        });
        document.querySelector('#new-post-form').style.display = 'none';
        // If the profile is the logged in user's profile, don't show button
        if (user_data.current_user === profile.id) {
            follow_button.style.display = 'none';
            document.querySelector('#new-post-form').style.display = 'block';
        } else if (is_following === true) {
            follow_button.innerHTML = 'Unfollow';
            follow_button.addEventListener('click', () => adjust_follow(username));
        } else {
            follow_button.innerHTML = 'Follow';
            follow_button.addEventListener('click', () => adjust_follow(username));
        }
    }
}

function add_listeners() {

    // Add event listeners to username on each post 
    const post_usernames = document.querySelectorAll('.username');
    post_usernames.forEach(username => {
        username.addEventListener('click', evt => load_profile(evt));
    });
    // Add event listeners to hearts on each post
    const like_hearts = document.querySelectorAll('.likes');
    like_hearts.forEach(heart => {
        heart.addEventListener('click', (evt) => adjust_like(evt));
    });
}

// Creates the post divs and paginator
function paginate_posts(posts) {
    
    var paginator = {
        "num_pages": 1,
        "pages": [],
        "current_page": 1,
        "page_iterator": 0
    };

    if (posts.length > 10) {
        // Get page count
        paginator.num_pages = Math.ceil(posts.length / 10);
        // Populate array of pages with posts
        for (var i = 0; i < paginator.num_pages; i++) {
            paginator.pages[i] = posts.splice(0,10);
        }
        // Display first page of posts
        create_post_divs(paginator.pages[0]);
    } else { create_post_divs(posts) }

    
    const paginator_element = document.querySelector('#paginator');
    paginator_element.innerHTML = `<button id="previous" class="btn btn-primary" type="button">Previous</button>
                            <p id="current_page">Page ${paginator.current_page}/${paginator.num_pages}</p>
                            <button id="next" class="btn btn-primary" type="button">Next</button>`;
    pagination_display(paginator);
    document.querySelector('#next').addEventListener('click', () => {
        paginator.page_iterator++;
        paginator.current_page++;
        create_post_divs(paginator.pages[paginator.page_iterator]);
        pagination_display(paginator);
        document.querySelector('#current_page').innerHTML = `Page ${paginator.current_page}/${paginator.num_pages}`;
    });

    document.querySelector('#previous').addEventListener('click', () => {
        paginator.page_iterator--;
        paginator.current_page--;
        create_post_divs(paginator.pages[paginator.page_iterator]);
        pagination_display(paginator);
        document.querySelector('#current_page').innerHTML = `Page ${paginator.current_page}/${paginator.num_pages}`
    });
}

function pagination_display(paginator) {

    // Checks if user is on first page
    if (paginator.page_iterator === 0) { document.querySelector('#previous').style.visibility = 'hidden' }
    else { document.querySelector('#previous').style.visibility = 'visible' }
    // Checks if there is a 'next' page
    if (!paginator.pages[paginator.page_iterator + 1]) { document.querySelector('#next').style.visibility = 'hidden' }
    else { document.querySelector('#next').style.visibility = 'visible' }
}

function create_post_divs(posts) {

    const posts_element = document.querySelector('#posts-body');
    posts_element.innerHTML = '';
    posts.forEach(post => {
        if (!post.likes) { post.likes = 0 }
        posts_element.innerHTML += `<div class="post">
                    <p class="username">${post.username}</p>
                    <p class="timestamp">${post.timestamp}</p>
                    <p class="content">${post.content}</p>
                    <p id="${post.id}" class="likes">❤️ ${post.likes}</p>
                    </div>`;
    });
}

function adjust_like(evt) {

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
    .then(user_data => {
        const profile = user_data.profile;
        const follow_button = document.querySelector('#follow-button');
        const followers_element = document.querySelector('#followers');
        // Change what follow button says depending on if user is following
        if (user_data.status === true) {
            follow_button.innerHTML = 'Unfollow';
        } else {
            follow_button.innerHTML = 'Follow';
        }
        // Update number of followers
        followers_element.innerHTML = `<p>Followers: ${profile.followers_count}</p>`;
    });
}