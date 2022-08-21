// recommended to run this code in strict mode for proper functionality
"use strict";

// This is the global list of the stories, an instance of StoryList. Set to undefined initially
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  //wait for stories from getStories function
  storyList = await StoryList.getStories();
  // remove "Loading..." message once stories populate
  $storiesLoadingMsg.remove();
  // call function to display stories
  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

//Hide delete buttons for now
function generateStoryMarkup(story, showDeleteBtn = false) {
  //load debug message in console
  console.debug("generateStoryMarkup", story);
  const hostName = story.getHostName();

  // if the user is logged in, display star icons next to stories
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
      ${showDeleteBtn ? getDeleteBtnHTML() : ""}
      ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

//Make delete button HTML for story
//Load trash-can icon from font-awesome and put it in a span container with the trash-can class. For use in generateStoryMarkup function.
function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

// Make favorite/not-favorite star for story. For use in generateStoryMarkup function
function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  //Accessing icons from font-awesome. Display solid star if isFavorite, hollow star otherwise
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

// Gets list of stories from server/API, generates their HTML, and puts on page. For use in generateStoryMarkup, getAndShowStoriesOnStart, updateUIOnUserLogin, and navAllStories

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  //jQuery method to remove all list items from the all-stories-list ol
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    //turn API story object into HTML
    const $story = generateStoryMarkup(story);
    //append generated HTML to DOM (ordered list)
    $allStoriesList.append($story);
  }
  //display stories list
  $allStoriesList.show();
}

/** Handle deleting a story. */

//must use async function here because removeStory and generateStoryMarkup functions are async and we're waiting for their results to be generated and applied to DOM
async function deleteStory(evt) {
  console.debug("deleteStory");
  //select the closest li up the DOM tree 
  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  //run the removeStory function on storyList with given currentUser and storyId from click event
  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  await putUserStoriesOnPage();
}

//on click of story, run deleteStory function
//When clicking on stories that have the .trash-can class (trash icon, user's stories only), delete that story
$ownStories.on("click", ".trash-can", deleteStory);

async function submitStory (e) {
  console.debug("submitStory");
  e.preventDefault();

  //grab all info from form
  const title = $("#add-story-title").val();
  const author = $("#add-story-author").val();
  const url = $("#add-story-url").val();
  const username = currentUser.username;
  //createdAt, storyId, and updatedAt are auto generated upon creating a story, so we don't need to add them here
  const storyData = {title, url, author, username};

  //run addStory function on storyList with given currentUser and storyData
  const story = await storyList.addStory(currentUser, storyData);

  //initializing jQuery object
  const $story = generateStoryMarkup(story);
  //add story to top of list
  $allStoriesList.prepend($story);

  //empty inputs of addStoryForm
  $addStoryForm.trigger("reset");
}

$addStoryForm.on("submit", submitStory);

//Functionality for list of user's own stories. For use in deleteStory and navMyStories functions.

function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  //remove all li's from my-stories ol
  $ownStories.empty();

  //let the user know when my-stories list is empty
  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No stories added by user yet!</h5>");
  } else {
    // loop through all of users stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      //add each story to the end of the my-stories ol
      $ownStories.append($story);
    }
  }
  //reveal my-stories list
  $ownStories.show();
}

/** Put favorites list on page. */

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  //remove all lis from favorited-stories ol
  $favoritedStories.empty();

  //let user know when favorites list is empty
  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added!</h5>");
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      //add each favorite story to the end of favorite-stories ol
      $favoritedStories.append($story);
    }
  }
  //reveal favorited-stories ol
  $favoritedStories.show();
}

/** Handle favorite/un-favorite a story */

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  console.log($tgt);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId); //I don't understand this line. Why is it necessary to select the story we're 

  // see if the item is already favorited (checking by presence of star)
  if ($tgt.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);
