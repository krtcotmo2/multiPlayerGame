//array of object of all players online
let allPlayers = [];
//array of object of all players in db for the leaderboard
let leaderBoard = [];
//constant for the the status of the person playing the game - these class naes have a specific icon linked to them
const statusIcons = {
     2: "online",
     3: "challenge",
     4: "challenge",
     5: "fight"
}
//object that represents the user logged into the game
let mainUser = {
     status: 1,
     name: "",
     userName: "",
     wins: 0,
     ties: 0,
     loses: 0,
     duelId: "",
     challenger: false
};
//object that represents the player the user is challenging, challenged by or currenlty dueling
let myOpp = {
     status: 1,
     name: "",
     userName: "",
     wins: 0,
     ties: 0,
     loses: 0,
     ties: 0,
     duelId: ""
};

//main object that controls the maon visual elemnts on the screen 
let gameControls = {
     //5 second interval that counts down the r/p/s duel
     theTimer:0,
     //10 seond timer waiting for a challenge response
     theTimeOut:0,
     //adds class to login seciton, changing layout and show main game board
     showMainStage: player => {
          $("#mainGame").css("display", "flex");
          $("#login").addClass("loggedIn");
          $("#curPlayerHeader h2").text(player.name);
     },
     //removes class to login seciton, clears name of person logged in changing layout and hide main game board
     hideMainStage: () => {
          $("#mainGame").css("display", "none");
          $("#login").removeClass("loggedIn");
          $("#login input[type='text']").val("");
          $("#loginSection").css("display", "block");
          $("#newUserSection").css("display", "none");
     },
     //pushes any player logged into the system into the current player section
     addPlayer: player => {
          let existplayer = allPlayers.find(o => o.userName === player.userName);
          if (!existplayer) {
               allPlayers.push(player);
               if(player.userName != mainUser.userName){
                    let playerCard = $("<div class='aPlayer online'>").html(player.name);
                    playerCard.attr("data-user", player.userName);
                    $("#players .card-body").append(playerCard);
               }
          }
     },
     //finds the row of a player with specific name and updaes the class to change the icon or adds them to teh page if not already present
     updatePlayer: player => {
          let playerIndex = allPlayers.findIndex(o => o.userName === player.userName);
          if (playerIndex > -1) {
               allPlayers[playerIndex] = player;
               $(`*[data-user="${player.userName}"]`).html(`${player.name}`).attr("class", "aPlayer").addClass(statusIcons[player.status]);
          } else {
               allPlayers.push(player);
          }
     },
     //finds the row of a person that logged out and remove tehm from teh current player panel
     removePlayer: player => {
          $(`*[data-user="${player.userName}"]`).remove();
          allPlayers = allPlayers.filter(obj => obj.userName != player.userName);
     },
     //show a modal popup window that issues an inital challenge to a player
     showChallenge: () => {
          myOpp = allPlayers.find(o => o.duelId == mainUser.duelId && o.userName != mainUser.userName);
          $("#mainModal .modal-title").text(`Challenge issued`);
          $("#mainModal .modal-body").text(`You have been challenged by ${myOpp.name}`);
          $("#mainModal .modal-footer").css("display", "none");
          $("#mainModal .modal-footer.challengebtns").css("display", "block");
          $("#mainModal").modal();
     },
     //builds up the center playing section of a game during a duel
     startGame: () => {
          //populates headline shows headline and instructions
          $("#gameCard h3").html(`You vs ${myOpp.name}`);
          $("#gameCard").removeClass("d-none");
          $("#btnDirection").removeClass("d-none");
          //hides the results of previous game, the rematch section and teh rematch response section
          $(".gameResults").addClass("d-none");
          $(".replaySection").addClass("d-none");
          $(".rematchResponse").addClass("d-none");
          //gets data from local storage that will determin if the instrutions are expanded or hidden.
          let dirShown = localStorage.getItem("dirShown");
          $(".optionImg").removeClass("chosen");
          $("#gameCard .inst").css("display", dirShown == "true" ? "block" : "none");
          let count = 5;
          $("#timerSection").text(count);    
          //sets interval at 5 and starts coutndown      
          gameControls.theTimer = setInterval(function () {
               count--;
               $("#timerSection").text(count);
               if (count == 0) {
                    fs.checkWinner(mainUser, myOpp);                   
                    clearInterval(gameControls.theTimer);
               }
          }, 1000);
          let s="";
     },
     //gets the results from the fs.checkWinner function 
     showResults: (result, oppChoice) => {
          $(".gameResults").removeClass("d-none");
          $(".gameResults h2").text(result);
          $(".gameResults .oppName").text(myOpp.name);
          $(".gameResults .oppChoice").text(oppChoice);
     },
     //clears the center card data
     resetCard: () => {
          //empty headline and hide all the controls
          $("#gameCard h3").html(``);
          $("#gameCard").addClass("d-none");
          $("#btnDirection").addClass("d-none");
          $(".gameResults").addClass("d-none");
          $(".replaySection").addClass("d-none");
          $(".rematchResponse").addClass("d-none");
          //removes the dropshadow and shading from the icons
          $(".optionImg").removeClass("chosen"); 
     },
     //show a panel to opponent A after a duel and opponent B click on a rematch button
     promptRematch: () => {
          //shows the rematch challenge sections and hides results of previous game
          $(".replaySection").addClass("d-none");
          $(".gameResults").addClass("d-none");
          $(".rematchResponse .oppName").text(myOpp.name);
          $(".rematchResponse").removeClass("d-none");
          //starts timer while waiting fr response - if times out, teh chellenge is withdrwan and both players return to the main fighting pool
          theTimeOut = setTimeout(function(){
               fs.removeDuel(mainUser, myOpp);
          }, 10000)
     },
     //constantly reordering the leader board based on the points of the players
     setLeaderBoard: () => {
          //sort command for teh leader board
          leaderBoard.sort(function(a,b){
               if(a.points<b.points){
                    return   1;
               }else if(a.points> b.points){
                    return -1
               }else{
                    if(a.wins + a.loses + a.ties < b.wins + b.loses + b.ties){
                         return 1;
                    }else{
                         return -1;
                    }
               }
          });
          //clear leaderboard section - loop through and create each name and point total
          $("#leaderBoard").html("");
          leaderBoard.forEach(function(a){
               let playerCard = $("<div class='aPlayer'>").html(`${a.name} ${a.points} `);
               $("#leaderBoard").append(playerCard);

          });
         
     }
};

