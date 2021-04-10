"use strict";

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
  $('.member-types__type').prop('disabled', true);
  $types.addClass('member-types--hidden');
  $pages.removeClass('sign-pages--hidden');
  $(".sign-pages__page[page-id=\"".concat(id, "\"]")).removeClass('sign-pages__page--hidden');
}

function resetPage() {
  $('.member-types__type').prop('disabled', false);
  $types.removeClass('member-types--hidden');
  $pages.addClass('sign-pages--hidden');
  $('.sign-pages__page').addClass('sign-pages__page--hidden');
  clearHash();
  $guestName.val('');
  $memberName.val('');
  $('.members__list__item').prop('checked', false);
  selectedMember = null;
  $memberSubmit.prop('disabled', true);
  clearMembersList();
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
var selectedMember = null;

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
  $membersList.children().remove();
}

function fillMembersList() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  if (name == null || name.length === 0) name = null;
  var $membersList = $('#membersList');
  var members = getRelevantMembers(name);
  clearMembersList();
  members.forEach(function (member) {
    var $item = $('<label/>', {
      "class": 'members__list__item',
      text: member
    });
    var $radio = $('<input/>', {
      type: 'radio',
      name: 'members',
      "class": 'members__list__item__button',
      value: member
    });
    $radio.on('click', function () {
      var $button = $(this);
      var $parent = $button.parent();
      var checked = $button.is(':checked');

      if (checked) {
        if ($parent.hasClass('members__list__item--selected')) {
          // Add unselect functionality
          $parent.removeClass('members__list__item--selected'); // Remove the selected class

          selectedMember = null; // Clear the selected member

          $button.prop('checked', false); // Set the checked state
        } else {
          $('.members__list__item').removeClass('members__list__item--selected');
          $parent.addClass('members__list__item--selected');
          selectedMember = $button.attr('value');
        }
      } // Set the done button to disabled if the selected member is null otherwise enable it


      $memberSubmit.prop('disabled', selectedMember == null);
    });
    $radio.appendTo($item);
    $item.appendTo($membersList);
  });
}

$memberName.on('input', function () {
  return fillMembersList($memberName.val());
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
  $loader.addClass('loader__wrapper--open');
  $loaderText.val(text);
}

function hideLoader() {
  $loader.removeClass('loader__wrapper--open');
}

var currentToastTimeout = -1;

function showToast(text) {
  var undoCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2500;
  var $toast = $('#toast');
  var $toastText = $('#toastText');
  var $toastUndo = $('#toastUndo');

  if (error) {
    $toast.addClass('toast--error');
  } else {
    $toast.removeClass('toast--error');
  }

  $toastUndo.bind('click', function () {
    return undoCallback != null && undoCallback();
  });

  if (undoCallback == null) {
    $toastUndo.css('display', 'none');
  } else {
    $toastUndo.css('display', 'revert');
  }

  $toastText.text(text);
  $toast.removeClass('toast--hidden');

  if (currentToastTimeout !== -1) {
    clearTimeout(currentToastTimeout);
  }

  currentToastTimeout = setTimeout(function () {
    $toast.addClass('toast--hidden');
    $toastUndo.unbind('click');
  }, duration);
} // Clear the page hash on reload


clearHash();

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
  if (selectedMember == null) return;
  var name = selectedMember;
  saveAttendance(name, true, function () {
    showToast('Successfully marked attendance for "' + name + '"', function () {
      removeAttendance(name, function () {
        showToast('Reverted attendance for "' + name + '"');
      });
    });
    resetPage();
  });
});
$guestSubmit.on('click', function () {
  var name = $guestName.val();

  if (name != null && name.length > 0) {
    saveAttendance(name, false, function () {
      showToast('Successfully marked attendance for "' + name + '"', function () {
        removeAttendance(name, function () {
          showToast('Reverted attendance for "' + name + '"');
        });
      });
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
        callback();
      } else {
        if (res.hasOwnProperty("reason")) {
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
        showToast('Successfully removed attendance for "' + name + '"', null);
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
  var $button = $(this);
  var name = $button.attr('data-name');
  console.log(name);

  if (name !== undefined && name !== null) {
    removeAttendance(name, function () {
      return $button.parents('.attendance__list__item').remove();
    });
  }
});
//# sourceMappingURL=app.js.map