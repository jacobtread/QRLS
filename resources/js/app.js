const clearHash = () => history.pushState("", document.title, window.location.pathname + window.location.search);

const $types = $('#types');
const $pages = $('#pages');
const $loader = $('#loader');
const $loaderText = $('#loaderText');

const $guestName = $('#guestName');
const $memberName = $('#memberName');

const $guestSubmit = $('#guestSubmit');
const $memberSubmit = $('#memberSubmit');

/*
*   Start Page Manipulation
*
*   This section of code controls the changing of the page
*   contents when the window hash changes
*   (#member, $guest, #facilitator)
*
*/

$(window).on('hashchange', () => {
    const hash = window.location.hash // The current window hash (e.g #guest)
    const pages = ["guest", "member", "facilitator"]; // A list of the valid pages
    if (hash.length < 1) {  // The hash was removed so we can ignore it
        return;
    }
    const page = hash.substr(1); // We remove the # from the hash to get the page name
    if (!pages.includes(page)) {  // Check if the page isn't valid
        return resetPage(); // Reset the page
    }
    toPage(page); // Open the page
})

function toPage(id) {
    $('.member-types__type').prop('disabled', true);
    $types.addClass('member-types--hidden');
    $pages.removeClass('sign-pages--hidden');
    $(`.sign-pages__page[page-id="${id}"]`).removeClass('sign-pages__page--hidden');
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
}

// Make the back button reset the page
$('#signBack').on('click', () => resetPage())

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
let members = [];
let selectedMember = null;

function loadMembers() {
    // Display the loader so the user knows whats happening
    showLoader('Loading Members...');
    // A Function that is called if we failed
    const fail = (point) => showToast('Failed to load members... POINT=' + point, null, true);
    // Ajax request to /members the backend endpoint for the members list
    $.get('/members')
        // If the request succeeds
        .done(res => {
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
        })
        // If the request fails
        .fail(() => fail(2))
        // We always want to close the loader no matter the result
        .always(() => hideLoader());
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
    const matching = [];
    // Each of the names and their rankings
    const rankings = {};
    members.forEach(member => {
        const lowerName = member.toLowerCase();
        let ranking = 0;
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
    });
    // Sort the names with their ranking (inverted sorting so higher ranks appear first)
    matching.sort((a, b) => rankings[b] - rankings[a]);
    return matching;
}

function clearMembersList() {
    const $membersList = $('#membersList');
    $membersList.children().remove();
}

function fillMembersList(name = null) {
    if (name == null || name.length === 0) name = null;
    const $membersList = $('#membersList');
    const members = getRelevantMembers(name);
    clearMembersList();
    members.forEach(member => {
        const $item = $('<label/>', {class: 'members__list__item', text: member});
        const $radio = $('<input/>', {
            type: 'radio',
            name: 'members',
            class: 'members__list__item__button',
            value: member
        });
        $radio.on('click', function () {
            const $button = $(this);
            const $parent = $button.parent();
            const checked = $button.is(':checked');
            if (checked) {
                if ($parent.hasClass('members__list__item--selected')) { // Add unselect functionality
                    $parent.removeClass('members__list__item--selected') // Remove the selected class
                    selectedMember = null; // Clear the selected member
                    $button.prop('checked', false) // Set the checked state
                } else {
                    $('.members__list__item').removeClass('members__list__item--selected');
                    $parent.addClass('members__list__item--selected')
                    selectedMember = $button.attr('value');
                }
            }
            // Set the done button to disabled if the selected member is null otherwise enable it
            $memberSubmit.prop('disabled', selectedMember == null);
        })
        $radio.appendTo($item);
        $item.appendTo($membersList);
    });
}

$memberName.on('input', () => fillMembersList($memberName.val()))


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

function showLoader(text = "Loading...") {
    $loader.addClass('loader__wrapper--open');
    $loaderText.val(text);
}

function hideLoader() {
    $loader.removeClass('loader__wrapper--open');
}

let currentToastTimeout = -1;

function showToast(text, undoCallback = null, error = false, duration = 2500) {
    const $toast = $('#toast');
    const $toastText = $('#toastText');
    const $toastUndo = $('#toastUndo');
    if (error) {
        $toast.addClass('toast--error');
    } else {
        $toast.removeClass('toast--error');
    }
    $toastUndo.bind('click', () => undoCallback != null && undoCallback());
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
    currentToastTimeout = setTimeout(() => {
        $toast.addClass('toast--hidden');
        $toastUndo.unbind('click');
    }, duration);
}


// Clear the page hash on reload

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

$memberSubmit.on('click', () => {
    if (selectedMember == null) return;
    const name = selectedMember;
    saveAttendance(name, true, () => {
        showToast('Successfully marked attendance for "' + name + '"', () => {
            removeAttendance(name, ()=>{
                showToast('Reverted attendance for "' + name + '"')
            })
        });
        resetPage();
    });
});

$guestSubmit.on('click', () => {
    const name = $guestName.val();
    if (name != null && name.length > 0) {
        saveAttendance(name, false, () => {
            showToast('Successfully marked attendance for "' + name + '"', () => {
                removeAttendance(name, ()=>{
                    showToast('Reverted attendance for "' + name + '"')
                })
            });
            resetPage();
        })
    }
});

function saveAttendance(name, member, callback) {
    showLoader('Saving Attendance...');
    // A Function that is called if we failed
    const fail = (point) => showToast('Failed to mark attendance... POINT=' + point, null, true);
    $.post('/attendance', {name: name, member: member}).done(res => {
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
    }).fail(() => fail(2)).always(() => hideLoader());
}

function removeAttendance(name, callback) {
    showLoader('Removing Attendance...');
    // A Function that is called if we failed
    const fail = (point) => showToast('Failed to change attendance... POINT=' + point, null, true);
    $.ajax('/attendance', {type: 'DELETE', data: {name: name}}).done(res => {
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
    }).fail(() => fail(2)).always(() => hideLoader());
}

$('.attendance__list__item__buttons__button').on('click', function () {
    const $button = $(this);
    const name = $button.attr('data-name');
    console.log(name)
    if (name !== undefined && name !== null) {
        removeAttendance(name, () => $button.parents('.attendance__list__item').remove());
    }
})