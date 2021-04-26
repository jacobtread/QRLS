"use strict";

// Clears the window hash
var clearHash = function clearHash() {
  return history.pushState("", document.title, window.location.pathname + window.location.search);
};

var $types = document.getElementById('types');
var $pages = document.getElementById('pages');
var $loader = document.getElementById('loader');
var $guestName = document.getElementById('guestName');
var $memberName = document.getElementById('memberName');
var $guestSubmit = document.getElementById('guestSubmit');
var $memberSubmit = document.getElementById('memberSubmit');
var $membersList = document.getElementById('membersList');
/*
*   Start Utilities
*
*   This section of code contains utility functions such
*   as loader controls, element manipulation, and networking
*
*/

/**
 *  Elements - Collects all elements matching the selector
 *  and runs the callback function with the element as the
 *  value
 *
 *  @param selector The css selector to get the elements for
 *  @param callback The callback function to run for each element
 */

function elements(selector, callback) {
  // Query the selector for all its elements then loop through them
  for (var i = 0, v = document.querySelectorAll(selector); i < v.length; i++) {
    callback(v[i]); // Run the callback with the element
  }
}
/**
 *  NonNull - Checks to make sure the provided element is not null
 *  then runs the callback if true
 *
 *  @param element The element to check if null
 *  @param callback The callback function to run if not null
 */


function nonNull(element, callback) {
  // Ensure not undefined and not null
  if (element !== undefined && element !== null) callback(element); // Run callback with element
}
/**
 *  TriggerClick - Triggers a click event on the provided element
 *
 *  @param element The element to click
 */


function triggerClick(element) {
  var event = document.createEvent('MouseEvents'); // Create a new mouse event

  event.initEvent('click', true, true); // Initialize a click event

  element.dispatchEvent(event); // Dispatch the event
}
/**
 *  IsEnterKey - A Utility function which takes in a keyboard event
 *  and returns whether or not the pressed key was the Enter key
 *
 *  @param event The keyboard event
 *  @return boolean Whether or not enter was pressed
 */


function isEnterKey(event) {
  var code;

  if (event["key"] !== undefined) {
    code = event["key"];
  } else if (event["keyIdentifier"] !== undefined) {
    code = event["keyIdentifier"];
  } else if (event["keyCode"] !== undefined) {
    code = event["keyCode"];
  }

  return code === 'Enter' || code === 'Return' || code === 13;
}
/**
 *  RemoveChildren - Removes all the child elements of the
 *  provided element
 *
 *  @param element The element to remove the children of
 */


function removeChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
/* == Loader manipulation == */

/**
 *  ShowLoader - Removes the hidden class from the loader element
 *  making it visible
 */


function showLoader() {
  $loader.classList.remove('loading-bar--hidden'); // Remove the class
}
/**
 *  HideLoader - Adds the hidden class to the loader element
 *  making it hidden
 */


function hideLoader() {
  $loader.classList.add('loading-bar--hidden'); // Add the class
}
/* == Toast manipulation == */


var toastHandle = -1; // The current toast timeout handle (For resetting the timeout)

var toastEventListener = null; // The current toast event listener (For handling Undo button clicks)

/**
 *  ShowToast - Displays the toast popup at the top of the window for
 *  the desired duration with the provided message
 *
 * @param text The message to display in the toast
 * @param undoCallback The function to run when "Undo" is pressed or null for no undo button
 * @param error Whether or not this is a error toast which should be displayed in red
 * @param duration The duration to display this toast for
 */

function showToast(text) {
  var undoCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2500;
  var toast = document.getElementById('toast'); // The toast element

  var toastText = document.getElementById('toastText');
  var toastUndo = document.getElementById('toastUndo');

  if (error) {
    // If the toast is an error toast
    toast.classList.add('toast--error'); // Add the error class
  } else {
    // Otherwise
    toast.classList.remove('toast--error'); // Remove the error class if its there
  }

  if (toastEventListener != null) {
    // If there is already a click listener
    // Clear the current click listener this prevents the bug
    // that causes all changes to be reverted when undo is pressed
    toastUndo.removeEventListener('click', toastEventListener);
  } // Create the toast event listener by running the undo callback
  // if its not null


  toastEventListener = function toastEventListener() {
    return undoCallback != null && undoCallback();
  }; // Add the callback to the undo button


  toastUndo.addEventListener('click', toastEventListener);

  if (undoCallback == null) {
    // If there is not a undo callback
    toastUndo.classList.add('toast__undo--hidden'); // Hide the "Undo" button
  } else {
    // Otherwise
    toastUndo.classList.remove('toast__undo--hidden'); // Show the "Undo" button
  } // Set the toast text content to the provided text


  toastText.textContent = text; // Remove the hidden class from the toast

  toast.classList.remove('toast--hidden');

  if (toastHandle !== -1) {
    // If a toast handle is already active
    clearTimeout(toastHandle); // Clear the timeout handle
  } // Assign the handle to a new timeout


  toastHandle = setTimeout(function () {
    // Once the timeout is complete
    toast.classList.add('toast--hidden'); // Hide the toast

    if (toastEventListener != null) {
      // Remove the event listener if one is attached
      toastUndo.removeEventListener('click', toastEventListener);
    }
  }, duration);
}
/* == Networking == */

/**
 *  Request - Creates a XMLHttpRequest object with the provided method, url,
 *  headers and executes the callback function when loaded or on error
 *
 *  @param method The HTTP request method
 *  @param url The HTTP request url
 *  @param headers The HTTP request headers
 *  @param callback The callback to run once the request is complete
 */


function request(method, url, headers, callback) {
  var request = new XMLHttpRequest(); // Create a new XMLHttpRequest

  request.open(method, url, true); // Open the request

  var headerKeys = Object.keys(headers); // Get all the header keys

  for (var i = 0; i < headerKeys.length; i++) {
    // Loop the header keys
    var key = headerKeys[i]; // Get the header key

    var value = headers[key]; // Get the header value using its key

    request.setRequestHeader(key, value); // Set the request header to the Key: Value
  }

  request.onload = function () {
    // When the request is loaded
    // When the status is between 200 and 400
    if (this.status >= 200 && this.status <= 400) {
      var data = JSON.parse(this.response); // Parse the JSON response

      callback(null, data); // Run the callback with the response data
    } else {
      // Run the callback with an error message
      callback('Connected to server but unable to process request.', null);
    }
  };

  request.onerror = function () {
    // When a connection problem occurs
    // Run the callback with an error message
    callback('Unable to connect to server', null);
  }; // Return the request object so that we can send it


  return request;
}
/**
 *  EncodeForm - Converts a object into a application/x-www-form-urlencoded
 *  form by joining all the data together
 *
 *  @param data The object to convert to form data
 *  @return string The form data (e.g username=user&password=pass)
 */


function encodeForm(data) {
  var output = ''; // Create the empty output

  var keys = Object.keys(data); // Get all of the object keys

  for (var i = 0; i < keys.length; i++) {
    // Loop through the keys
    var key = keys[i]; // Get the current key

    var value = data[key]; // Get the current value with the key
    // Append the encoded data to output

    output += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
  } // Return the output with the last & trimmed off


  return output.substr(0, output.length - 1);
}
/**
 *  Get - Sends a GET request to the provided url and runs
 *  the callback when done
 *
 *  @param url The HTTP request url
 *  @param callback The callback to run once the request is complete
 */


function get(url, callback) {
  request('GET', url, {
    'Accept': 'application/json; charset=UTF-8' // We only need to accept JSON

  }, callback).send(); // Create and send the request
}
/**
 *  Post - Sends a POST request to the provided url with the
 *  provided form data and runs the callback when done
 *
 *  @param url The HTTP request url
 *  @param data The HTTP request form data
 *  @param callback The callback to run once the request is complete
 */


function post(url, data, callback) {
  request('POST', url, {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json; charset=UTF-8'
  }, callback).send(encodeForm(data)); // Create the request and send the encoded form
}
/**
 *  Del/Delete - Sends a DELETE request to the provided url with the
 *  provided form data and runs the callback when done
 *
 *  @param url The HTTP request url
 *  @param data The HTTP request form data
 *  @param callback The callback to run once the request is complete
 */


function del(url, data, callback) {
  request('DELETE', url, {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json; charset=UTF-8'
  }, callback).send(encodeForm(data)); // Create the request and send the encoded form
}
/*
*
*   End Utilities
*
*   ########################

*   Start Page Manipulation
*
*   This section of code controls the changing of the page
*   contents when the window hash changes
*   (#member, $guest)
*
*/
// When the window hash code changes


window.onhashchange = function () {
  var hash = window.location.hash; // The current window hash (e.g #guest)

  var pages = ["guest", "member"]; // A list of the valid pages

  if (hash.length < 1) {
    // The hash was removed so we can ignore it

    /*
    * If the hash was removed we don't want to make changes
    * Because it was most likely changes via resetPage()
    */
    return;
  }

  var page = hash.substr(1); // We remove the # from the hash to get the page name

  if (!pages.includes(page)) {
    // Make sure the hash value is listed in the pages
    return resetPage(); // If not reset the page (this corrects the hash)
  }

  toPage(page); // Open the selected page
};
/**
 *  ToPage - Shows the selected page
 *
 *  @param id The id of the page to show
 */


function toPage(id) {
  resetTimeout(); // Clear the current timeout (we dont want to reset the page right after opening it)
  // Disable all type buttons so we cant accidentally tab select them

  elements('.member-types__type', function (element) {
    return element.disabled = true;
  });
  $types.classList.add('member-types--hidden'); // Hide the types page so it goes out of view

  $pages.classList.remove('sign-pages--hidden'); // Show the sign-in page so that its visible
  // Get the current page via its id

  var currentPage = document.querySelector('.sign-pages__page[page-id="' + id + '"]'); // Remove the hidden class for the current page so its visible

  nonNull(currentPage, function (element) {
    return element.classList.remove('sign-pages__page--hidden');
  });

  if (id === 'member') {
    // If we are selecting the member page
    $memberName.focus(); // Focus the member input
  } else {
    // Otherwise
    $guestName.focus(); // Focus the guest input
  }
}
/**
 *  ResetPage - Resets the page to its default state,
 *  clears all the inputs, clears the page hash, takes
 *  inputs out of focus and shows main menu
 */


function resetPage() {
  resetTimeout(); // Reset the page timeout
  // Enables all the type buttons again so they can be pushed

  elements('.member-types__type', function (element) {
    return element.disabled = false;
  });
  $types.classList.remove('member-types--hidden'); // Show the tpyes page so it comes into view

  $pages.classList.add('sign-pages--hidden'); // Hide the sign-in page so it goes out of view

  elements('.sign-pages__page', function (element) {
    return element.classList.add('sign-pages__page--hidden');
  }); // Hide all sign-in pages

  clearHash(); // Clear the window hash so that the next user will always get the home page

  $guestName.value = ''; // Clear the guest name input

  $memberName.value = ''; // Clear the member name input

  elements('.members__list__item', function (e) {
    return e.checked = false;
  }); // Uncheck all the members radio buttons

  selectedMember = null; // Set the selected member to done

  $guestSubmit.disabled = true; // Disable the guest submit button

  $memberSubmit.disabled = true; // Disable the member submit button

  removeChildren($membersList); // Remove all the members list children

  $memberName.blur(); // Take the member name input out of focus

  $guestName.blur(); // Take the guest name input out of focus
}
/**
 *  SetCacheBadge - Changes the visibility of the "Cached" badge in the
 *  top corner of the screen indicating if the response is cached or not
 *
 *  @param cached Whether or not the list is cached
 */


function setCacheBadge(cached) {
  var $cacheIndicator = document.getElementById('cacheIndicator');

  if (cached) {
    $cacheIndicator.classList.remove('cache-indicator--hidden');
  } else {
    $cacheIndicator.classList.add('cache-indicator--hidden');
  }
} // Add the functionality for the back button


nonNull(document.getElementById('signBack'), function (element) {
  return element.onclick = function () {
    return resetPage();
  };
});
/*
*   End Page Manipulation
*
*   ########################
*
*   Start Member Handling
*
*   This section of code controls retrieving the members list from
*   the backend, filtering, and sorting that data to display it
*
*/
// This stores the list of members retrieved from the server

var members = [];
var selectedMember = null; // Stores the selected member

var LOAD_RETRY_DELAY = 2 * 1000; // The time before attempting to load the members after failing is milliseconds (2 seconds)

/**
 *  LoadMembers - Loads the list of members from the backend server
 *  and displays a loader while its happening then updates the cache
 *  badge when done
 */

function loadMembers() {
  // Display the loader so the user knows whats happening
  showLoader(); // A Function that is called if we failed

  var fail = function fail(reason) {
    showToast("Failed to load members: ".concat(reason, " (Retrying in ").concat(LOAD_RETRY_DELAY / 1000, "s)"), null, true);
    setTimeout(function () {
      // Wait the load retry delay
      loadMembers(); // Load the members again
    }, LOAD_RETRY_DELAY);
  }; // Ajax request to /members the backend endpoint for the members list


  get('/members', function (err, res) {
    if (err != null) {
      fail(err); // Warn the user
    } else {
      if (!res.hasOwnProperty('status')) {
        // If the request is missing a status
        fail('Malformed Server Response status missing'); // Warn the user
      } else {
        // Otherwise
        if (res.status === 'success' && res.hasOwnProperty("members") && res.hasOwnProperty("cached")) {
          // Make sure the request has all the required data
          members = res.members;
          setCacheBadge(res.cached); // Set the cache badge
        } else {
          fail('Malformed Server Response'); // Warn the user
        }
      }
    } // Always hide the loader


    hideLoader();
  });
}
/**
 *  GetRelevantMembers - Filters the members list based on the provided query
 *  and sorts the list based on how much of a match it is
 *
 *  Names are ranked using a score from 0 - 8
 *  the score is determined by how much matching
 *  parts the name has with the member
 *
 *  Full Match: 4
 *  Start Match +2
 *  Contains Match +1
 *
 *   All of these can stack up except for the full match
 *
 *  @param query The name search query
 *  @return array The filtered list of members
 */


function getRelevantMembers(query) {
  // If the query is null we ignore everyone
  if (query == null) {
    return []; // Return an empty array
  }

  query = query.toLowerCase(); // The lowercase query

  var matching = []; // The matching results

  var rankings = {}; // The rankings for each result

  for (var i = 0; i < members.length; i++) {
    // Loop through all the members
    var member = members[i]; // Get the member

    var memberLower = member.toLowerCase(); // Get a lowercase copy of the name for ignore case matching

    var ranking = 0; // The current member ranking

    if (query === memberLower) {
      // If we a complete match
      ranking = 4; // Set the highest available ranking
    } else {
      // If the name starts with the query set the second highest ranking
      if (memberLower.startsWith(query)) ranking += 2; // If the name contains the query increase the ranking

      if (memberLower.indexOf(query) >= 0) ranking += 1;
    } // Set the ranking of the member to its ranking


    rankings[member] = ranking;

    if (ranking > 0) {
      // If the ranking is greater than 0
      matching.push(member); // Add it to the matching list
    }
  } // Sort the names with their ranking (inverted sorting so higher ranks appear first)


  matching.sort(function (a, b) {
    return rankings[b] - rankings[a];
  }); // Return the matching names

  return matching;
}
/**
 *  FillMembersList - Fills the members list with the members radio buttons
 *  and clears the current contents
 *
 *  @param query The name search query
 */


function fillMembersList() {
  var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  if (query == null || query.length === 0) query = null; // If the query is empty we just make it null

  var members = getRelevantMembers(query); // Get the members relevant to the search

  removeChildren($membersList); // Remove all the members list children

  var tabIndex = 5; // The current page tab index

  var _loop = function _loop(i) {
    // Loop through all the members
    var member = members[i]; // Get the current member
    // Create the label wrapping so the whole thing acts a radio button

    var $item = document.createElement('label');
    $item.classList.add('members__list__item'); // Add the list item class

    $item.textContent = member; // Set the element text content

    /*
    * Fixed window tabbing in commit
    * e3641cf4874c884437c95e8be6457e8e84e69fa5
    * using tabIndex
    */

    $item.tabIndex = tabIndex; // Set the element tab index

    tabIndex++; // Increase the tab index
    // Create the radio button

    var $radio = document.createElement('input');
    $radio.type = 'radio'; // Set the input type to radio button

    $radio.name = 'members'; // Set the radio name to "members" so its grouped with the others

    $radio.classList.add('members__list__item__button'); // Add the button class

    $radio.value = member; // Set the value to the member name

    $item.onkeydown = function (e) {
      // When a key is pressed while the item is focused
      if (isEnterKey(e)) {
        // If the enter key is pressed
        var _$radio = $item.childNodes.item(0); // Get the first child (this is the radio button)


        triggerClick(_$radio); // Click the radio button to select it

        $memberSubmit.disabled = selectedMember == null; // Set the submit button disabled state

        triggerClick($memberSubmit); // Click the submit button
      }
    };

    $radio.onclick = function () {
      // When the radio button is clicked
      var parent = $radio.parentNode; // Get the parent element

      if ($radio.checked) {
        // If the button is checked
        if (parent.classList.contains('members__list__item--selected')) {
          // If its already selected
          triggerClick($memberSubmit); // Double click triggers save so submit
        } else {
          // Remove the selected class from the other elements
          elements('.members__list__item', function (e) {
            return e.classList.remove('members__list__item--selected');
          });
          parent.classList.add('members__list__item--selected'); // Add the selected class

          selectedMember = $radio.value; // Set the selected member to the value of the radio button
        }
      } // Set the done button to disabled if the selected member is null otherwise enable it


      $memberSubmit.disabled = selectedMember == null;
    }; // Append the radio button to the item


    $item.appendChild($radio); // Append the item to the members list

    $membersList.appendChild($item);
  };

  for (var i = 0; i < members.length; i++) {
    _loop(i);
  }
}
/*
*   Clear the page hash on reload to ensure
*   The user is always give the main page
*/


clearHash();
/*
*   End Member Handling
*
*   ########################
*
*   Start Timeout Handling
*
*   This section of code handles the automatic timeout of the
*   window which resets the page every 60 seconds so that
*   if someone presses a button then leaves it will return
*   to the main menu
*
*/

var TIMEOUT_DELAY = 60 * 1000; // The delay to timeout after in milliseconds (60 seconds)

var timeoutHandle = -1; // The handle for the current timeout

/**
 *  ClearScreen - Clears the screen when the page timeout has finished
 *  and loads the members list again
 */

function clearScreen() {
  resetPage(); // Reset the page

  loadMembers(); // Load the members list
}
/**
 *  ResetTimeout - Resets the currently running window
 *  timeout
 */


function resetTimeout() {
  clearTimeout(timeoutHandle); // Clear the current timeout using the handle

  timeoutHandle = setTimeout(clearScreen, TIMEOUT_DELAY); // Set a new timeout to the handle
} // When we are not on the attendance page


if (document.location.pathname !== '/attending') {
  loadMembers(); // Load the members list

  resetTimeout(); // Set the window timeout
}
/*
*   End Timeout Handling
*
*   ########################
*
*   Start Attendance Marking
*
*   This section of code controls the marking of attendance
*   via the backend along with its respective frontend
*
*/
// Make sure the member submit button is not null


nonNull($memberSubmit, function (element) {
  // When the button is clicked
  element.onclick = function () {
    if (selectedMember != null) {
      //  if the selected member is not null
      saveAttendance(selectedMember, true); // Save the attendance
    }
  };
}); // Make sure the member name input is not null

nonNull($memberName, function (element) {
  // When a key is released for the GuestName input
  element.onkeyup = function (event) {
    if (isEnterKey(event)) {
      // Enter key pushed
      var name = element.value; // Get the current name

      if (name == null || name.length === 0) name = null; // If the name is empty we just make it null

      var relevantMembers = getRelevantMembers(name);

      if (relevantMembers.length > 0) {
        // Make sure we have members
        selectedMember = relevantMembers[0]; // Selected the first member

        $memberSubmit.disabled = selectedMember == null; // Set the disabled state of the submit button

        triggerClick($memberSubmit); // Click the submit button
      }
    }

    resetTimeout(); // Make sure we don't timeout mid typing

    fillMembersList(element.value); // Fill the members list filtered to the new query
  };
}); // Make sure the guest name input is not null

nonNull($guestName, function (element) {
  // When a key is pressed on the guest name input
  element.onkeyup = function (event) {
    if (isEnterKey(event)) {
      // If the pressed key was enter
      triggerClick($guestSubmit); // Click the guest submit button
    }

    resetTimeout(); // Make sure we don't timeout when typing

    $guestSubmit.disabled = element.value.length < 1; // Set the submit button to disable if there is no name
  };
}); // Make sure the guest submit button is not null

nonNull($guestSubmit, function (element) {
  // When the guest submit button is clicked
  element.onclick = function () {
    var name = $guestName.value; // Get the guest name

    if (name != null && name.length > 0) {
      // Save the attendance
      saveAttendance(name, false);
    }
  };
});
/**
 *  SaveAttendance - Sends a post request to the backend saving the
 *  attendance for the provided name and setting guest based on the
 *  provided member
 *
 *  @param name The name to mark attendance for
 *  @param member Whether or not the attendance is of a member
 */

function saveAttendance(name, member) {
  showLoader(); // Show the loader
  // A Function that is called if we failed

  var fail = function fail(reason) {
    return showToast('Failed to mark attendance: ' + reason, null, true);
  };

  post('/attendance', {
    name: name,
    member: member
  }, function (err, res) {
    if (err != null) {
      fail(err); // Fail because we couldn't connect
    } else {
      // Make sure the request isn't malformed
      if (!res.hasOwnProperty('status')) {
        fail('Malformed server data'); // Failed because missing status
      } else {
        if (res.status === 'success') {
          // Show a toast telling the user its been marked
          showToast('Successfully marked attendance for "' + name + '"', function () {
            // The callback that occurs if undo is pressed
            // Remove the attendance
            removeAttendance(name, function () {
              // After the attendance is removed
              showToast('Reverted attendance for "' + name + '"'); // Show a toast telling the user its been reverted
            });
          }); // Take the user back to the main page

          resetPage();
        } else {
          if (res.hasOwnProperty("reason")) {
            // Show a error toast
            showToast(res.reason, null, true);
          } else fail('Unknown Reason'); // Fail with an unknown reason

        }
      }
    }

    hideLoader(); // Always hide the loader
  });
}

function removeAttendance(name, callback) {
  showLoader(); // Show the loader
  // A Function that is called if we failed

  var fail = function fail(reason) {
    return showToast('Failed to change attendance: ' + reason, null, true);
  };

  del('/attendance', {
    name: name
  }, function (err, res) {
    if (err != null) {
      fail(err); // Fail because we couldn't connect
    } else {
      // Make sure the request isn't malformed
      if (!res.hasOwnProperty('status')) {
        fail('Malformed server data'); // Failed because missing status
      } else {
        if (res.status === 'success') {
          // Show a toast letting the user know the attendance was marked
          showToast('Successfully removed attendance for "' + name + '"', null); // Run the callback

          callback();
        } else fail('Unknown Reason'); // Fail with an unknown reason

      }
    }

    hideLoader(); // Always hide the loader
  });
}
/*
*   End Attendance Marking
*
*   ########################
*
*   Start Attendance List
*
*   This section of code controls the attendance list
*   code such as the delete buttons
*
*/
// For all of the delete buttons on the attendance page


elements('.attendance__list__item__buttons__button', function (element) {
  return element.onclick = function () {
    // When the element is clicked
    var name = element.getAttribute('data-name'); // Get the name attribute

    if (name !== undefined && name !== null) {
      // If there is a name attribute
      if (confirm('Are you sure you want to remove the attendance for "' + name + '"')) {
        // Confirm the user wants to remove it
        removeAttendance(name, function () {
          // Remove the attendance
          var parent = element.parentElement.parentElement; // Get the root element

          var listItem = parent.parentElement; // Get its parent

          listItem.removeChild(parent); // Remove the element using its parent
        });
      }
    }
  };
});
//# sourceMappingURL=app.js.map