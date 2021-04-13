"use strict";

// Clears the window hash
var clearHash = function clearHash() {
  return history.pushState("", document.title, window.location.pathname + window.location.search);
};

var $types = $('#types');
var $pages = $('#pages');
var $loader = $('#loader');
var $loaderText = $('#loaderText');
var $guestName = $('#guestName');
var $memberName = $('#memberName');
var $guestSubmit = $('#guestSubmit');
var $memberSubmit = $('#memberSubmit');
/*
*   Start Page Manipulation
*
*   This section of code controls the changing of the page
*   contents when the window hash changes
*   (#member, $guest, #facilitator)
*
*/

$(window).on('hashchange', function () {
  var hash = window.location.hash; // The current window hash (e.g #guest)

  var pages = ["guest", "member", "facilitator"]; // A list of the valid pages

  if (hash.length < 1) {
    // The hash was removed so we can ignore it
    return;
  }

  var page = hash.substr(1); // We remove the # from the hash to get the page name

  if (!pages.includes(page)) {
    // Check if the page isn't valid
    return resetPage(); // Reset the page
  }

  toPage(page); // Open the page
});

function toPage(id) {
  // Disable all type buttons so that hitting tab wont focus on them
  $('.member-types__type').prop('disabled', true);
  $types.addClass('member-types--hidden'); // Add the hidden class to hide it

  $pages.removeClass('sign-pages--hidden'); // Remove the hidden class to show it

  $(".sign-pages__page[page-id=\"".concat(id, "\"]")).removeClass('sign-pages__page--hidden'); // Remove the hidden class for the current page
}

function resetPage() {
  $('.member-types__type').prop('disabled', false); // Make the member types not hidden

  $types.removeClass('member-types--hidden'); // Remove the hidden class to show it

  $pages.addClass('sign-pages--hidden'); // Add the hidden class to hide it

  $('.sign-pages__page').addClass('sign-pages__page--hidden'); // Add hidden class to hide the pages

  clearHash(); // Clear the current page

  $guestName.val(''); // Reset the guest name

  $memberName.val(''); // Reset the member name

  $('.members__list__item').prop('checked', false); // Uncheck all the members radio buttons

  selectedMember = null; // Set the selected member to done

  $memberSubmit.prop('disabled', true); // Disable the member submit button

  clearMembersList(); // Clear the list of members
} // Make the back button reset the page


$('#signBack').on('click', function () {
  return resetPage();
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

function loadMembers() {
  // Display the loader so the user knows whats happening
  showLoader('Loading Members...'); // A Function that is called if we failed

  var fail = function fail(point) {
    return showToast('Failed to load members... POINT=' + point, null, true);
  }; // Ajax request to /members the backend endpoint for the members list


  $.get('/members') // If the request succeeds
  .done(function (res) {
    // Make sure the request isn't malformed
    if (!res.hasOwnProperty('status')) {
      fail(0); // Failed because missing status
    } else {
      if (res.status === 'success' && res.hasOwnProperty("members")) {
        members = res.members;
      } else {
        fail(1);
      }
    }
  }) // If the request fails
  .fail(function () {
    return fail(2);
  }) // We always want to close the loader no matter the result
  .always(function () {
    return hideLoader();
  });
}

function getRelevantMembers(name) {
  /*
  *   Names are ranked using a score from 0 - 8
  *   the score is determined by how much matching
  *   parts the name has with the member
  *
  *   Full Match: 4
  *   Start Match +2
  *   Contains Match +1
  *
  *   All of these can stack up except for the full match
  */
  // If the name is null we ignore everyone
  if (name == null) {
    return [];
  }

  name = name.toLowerCase();
  var matching = []; // Each of the names and their rankings

  var rankings = {};
  members.forEach(function (member) {
    var lowerName = member.toLowerCase();
    var ranking = 0;

    if (name === lowerName) {
      ranking = 4;
    } else {
      if (lowerName.startsWith(name)) ranking += 2;
      if (lowerName.indexOf(name) >= 0) ranking += 1;
    }

    rankings[member] = ranking;

    if (ranking > 0) {
      matching.push(member);
    }
  }); // Sort the names with their ranking (inverted sorting so higher ranks appear first)

  matching.sort(function (a, b) {
    return rankings[b] - rankings[a];
  });
  return matching;
}

function clearMembersList() {
  var $membersList = $('#membersList');
  $membersList.children().remove(); // Remove all the children
}

function fillMembersList() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  if (name == null || name.length === 0) name = null; // If the name is empty we just make it null

  var $membersList = $('#membersList');
  var members = getRelevantMembers(name); // Get the members relevant to the search

  clearMembersList(); // Clear the list of members
  // Loop through all the members

  members.forEach(function (member) {
    // Create the label wrapping so the whole thing acts a radio button
    var $item = $('<label/>', {
      "class": 'members__list__item',
      text: member
    }); // Create the radio button

    var $radio = $('<input/>', {
      type: 'radio',
      name: 'members',
      "class": 'members__list__item__button',
      value: member
    }); // Set the click logic for the radio button

    $radio.on('click', function () {
      var $button = $(this); // Get a jquery instance of the button

      var $parent = $button.parent(); // Get the parent element

      var checked = $button.is(':checked'); // Check if the button is checked

      if (checked) {
        if ($parent.hasClass('members__list__item--selected')) {
          // Add unselect functionality
          $parent.removeClass('members__list__item--selected'); // Remove the selected class

          selectedMember = null; // Clear the selected member

          $button.prop('checked', false); // Set the checked state
        } else {
          $('.members__list__item').removeClass('members__list__item--selected'); // Remove the selected class from the other elements

          $parent.addClass('members__list__item--selected'); // Add the selected class

          selectedMember = $button.attr('value'); // Set the selected member to the value of the radio button
        }
      } // Set the done button to disabled if the selected member is null otherwise enable it


      $memberSubmit.prop('disabled', selectedMember == null);
    }); // Append the radio button to the item

    $radio.appendTo($item); // Append the item to the members list

    $item.appendTo($membersList);
  });
} // Change the contents of the members list when the name changes


$memberName.on('input', function () {
  return fillMembersList($memberName.val());
}); // When a key is released for the GuestName input

$memberName.on('keyup', function (e) {
  if (e.keyCode === 13) {
    // Enter key pushed
    var name = $memberName.val();
    if (name == null || name.length === 0) name = null; // If the name is empty we just make it null

    var viewMembers = getRelevantMembers(name);

    if (viewMembers.length > 0) {
      // Make sure we have members
      selectedMember = viewMembers[0]; // Selected the first member

      $('.members__list__item__button[value="' + selectedMember + '"]').trigger('click'); // Select the corresponding input

      $memberSubmit.prop('disabled', selectedMember == null); // Enable the button

      $memberSubmit.trigger('click'); // Click the button
    }
  }
});
/*
*   End Member Handling
*
*   ########################
*
*   Start Loading Handling & Toasts
*
*   This section of code controls the displaying and hiding
*   of page loaders and toasts
*
*/

function showLoader() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "Loading...";
  $loader.addClass('loader__wrapper--open'); // Add the open loader class

  $loaderText.val(text); // Set the text of the loader
}

function hideLoader() {
  $loader.removeClass('loader__wrapper--open'); // Remove the loader open class
}

var currentToastTimeout = -1; // The timeout identifier of setTimeout for the toast

function showToast(text) {
  var undoCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2500;
  var $toast = $('#toast');
  var $toastText = $('#toastText');
  var $toastUndo = $('#toastUndo');

  if (error) {
    // If the toast in an error toast add the error class
    $toast.addClass('toast--error');
  } else {
    // Otherwise remove the error class
    $toast.removeClass('toast--error');
  } // Bind bind the click event to the undo callback if it exists


  $toastUndo.bind('click', function () {
    return undoCallback != null && undoCallback();
  });

  if (undoCallback == null) {
    // If there is no undo callback hide the undo button
    $toastUndo.css('display', 'none');
  } else {
    $toastUndo.css('display', 'revert');
  }

  $toastText.text(text); // Set the toast text

  $toast.removeClass('toast--hidden'); // Remove the toast hidden class

  if (currentToastTimeout !== -1) {
    // If there is already a timeout
    clearTimeout(currentToastTimeout); // Clear the current timeout
  } // Set the timeout to a new setTimeout


  currentToastTimeout = setTimeout(function () {
    // When the duration is complete
    $toast.addClass('toast--hidden'); // Add the hidden class again

    $toastUndo.unbind('click'); // Unbind the click callback
  }, duration);
} // Clear the page hash on reload


clearHash(); // Only load members on the main page not /attending

if (document.location.pathname !== '/attending') {
  loadMembers();
}
/*
*   End Loading Handling & Toasts
*
*   ########################
*
*   Start Attendance Marking
*
*   This section of code controls the marking of attendance
*   via the backend along with its respective frontend
*
*/


$memberSubmit.on('click', function () {
  if (selectedMember == null) return; // If there is no selected member return

  var name = selectedMember; // Save the attendance

  saveAttendance(name, true, function () {
    // After the attendance is saved
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
  });
}); // When a key is released for the GuestName input

$guestName.on('keyup', function (e) {
  if (e.keyCode === 13) {
    // Enter key pushed
    $guestSubmit.trigger('click'); // Click the button for the user
  }
});
$guestSubmit.on('click', function () {
  var name = $guestName.val();

  if (name != null && name.length > 0) {
    // Save the attendance
    saveAttendance(name, false, function () {
      // After the attendance is saved
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
    });
  }
});

function saveAttendance(name, member, callback) {
  showLoader('Saving Attendance...'); // A Function that is called if we failed

  var fail = function fail(point) {
    return showToast('Failed to mark attendance... POINT=' + point, null, true);
  };

  $.post('/attendance', {
    name: name,
    member: member
  }).done(function (res) {
    // Make sure the request isn't malformed
    if (!res.hasOwnProperty('status')) {
      fail(0); // Failed because missing status
    } else {
      if (res.status === 'success') {
        // Call the callback
        callback();
      } else {
        if (res.hasOwnProperty("reason")) {
          // Show a error toast
          showToast(res.reason, null, true);
        } else fail(1);
      }
    }
  }).fail(function () {
    return fail(2);
  }).always(function () {
    return hideLoader();
  });
}

function removeAttendance(name, callback) {
  showLoader('Removing Attendance...'); // A Function that is called if we failed

  var fail = function fail(point) {
    return showToast('Failed to change attendance... POINT=' + point, null, true);
  };

  $.ajax('/attendance', {
    type: 'DELETE',
    data: {
      name: name
    }
  }).done(function (res) {
    // Make sure the request isn't malformed
    if (!res.hasOwnProperty('status')) {
      fail(0); // Failed because missing status
    } else {
      if (res.status === 'success') {
        // Show a toast letting the user know the attendance was marked
        showToast('Successfully removed attendance for "' + name + '"', null); // Run the callback

        callback();
      } else {
        fail(1);
      }
    }
  }).fail(function () {
    return fail(2);
  }).always(function () {
    return hideLoader();
  });
}

$('.attendance__list__item__buttons__button').on('click', function () {
  var $button = $(this); // The name of the attendance item

  var name = $button.attr('data-name');

  if (name !== undefined && name !== null) {
    // Remove the attendance for that name
    removeAttendance(name, function () {
      return $button.parents('.attendance__list__item').remove();
    });
  }
});
//# sourceMappingURL=app.js.map