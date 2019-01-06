let validNavigation = false;

function wireUpEvents() {
     let leave_message = 'You sure you want to leave?'
     function goodbye(e) {
          fs.logOut(mainUser.userName, fs);
          return leave_message;
     }
     window.onbeforeunload = goodbye;
     $(document).bind('keypress', function (e) {
          if (e.keyCode == 116) {
               validNavigation = true;
          }
     });
     $("form").bind("submit", function () {
          validNavigation = true;
     });
     $("input[type=submit]").bind("click", function () {
          validNavigation = true;
     });
}

// Wire up the events as soon as the DOM tree is ready
$(document).ready(function () {
     wireUpEvents();
});