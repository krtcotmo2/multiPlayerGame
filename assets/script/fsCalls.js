//general obejct handling the firebase.firestore calls
let fs = {
     //function fires when a new user is being created   
     newUser: async (theName, theId, thisObj) =>{
          db = firebase.firestore();        
          potentialNew = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", theId).get()
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error in checking if user exists.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();  
               return;                      
          });
          //handle circumstance if when user tries to create id tha already exists 
          if(potentialNew.size > 0){
               $("#tboxUserName").val("");
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("The User ID you have entered already exsits");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
               return;
          }     
          //create default objcet for a new user
          thisObj.name= theName,
          thisObj.userName= theId,
          thisObj.wins= 0,
          thisObj.ties= 0,
          thisObj.loses= 0,
          thisObj.status= 
          //inserts the new user into the db
          db.collection("users").doc(theId).set({
               name: thisObj.name,
               wins: thisObj.wins,
               ties: thisObj.ties,
               loses: thisObj.loses,
               status: thisObj.status
          })
          .catch(function(error) {
               //Open modal with save error message
               $("#mainModal .modal-title").text(`Error while saving new users.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });  
          //fire off the show main components of the playing stage      
          gameControls.showMainStage(thisObj);
     },
     //function fires when a user logs in with an existing id passes in tne mainUser object as second argument
     getUserId: async (userId, thisObj) => { 
          db = firebase.firestore();
          //get user from db that matches the id provided in login form          
          curPlayer = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", userId).get()
          .catch(function(error) {
               //opens modal showing error message
               $("#mainModal .modal-title").text(`Error while logging in.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
          //checks to see if the id entered is already logged in
          if(curPlayer.size == 1 && curPlayer.docs[0].data().status != 1){
               //open modal window with a force log out option button
               thisObj.status = 1;
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Someone is logged in under that name.");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal .modal-footer.forceLogout").css("display", "block");
               $("#mainModal").modal();
          }else if(curPlayer.size == 1 && (curPlayer.docs[0].data().status == 1)){
               //set status to logged on (2) and send status to db for that player
               thisObj.status = 2;                
               let  theStatus = db.collection('users').doc(curPlayer.docs[0].id);
               theStatus.set({
                   status: 2
               }, { merge: true })
               .catch(function(error) {
                    //opens modal showing error message
                    $("#mainModal .modal-title").text(`Error while setting status of user to logged in.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               });
               //sets the mainuser objectwith the status pulled from db
               thisObj.dbID = curPlayer.docs[0].id;
               thisObj.userName = curPlayer.docs[0].id;
               thisObj.name = curPlayer.docs[0].data().name;
               thisObj.wins = curPlayer.docs[0].data().wins;
               thisObj.loses = curPlayer.docs[0].data().loses;
               thisObj.ties = curPlayer.docs[0].data().ties;
               //shows teh game controls
               gameControls.showMainStage(curPlayer.docs[0].data());
          }else if(curPlayer.size == 0){
               //shows modal message stating that the user id entered is not in he db
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Username does not exist");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
          }
     },
     //function fires on game load and tracks the point scores for all users
     getLeaderboard: () => {
          db = firebase.firestore();
          let lb = db.collection("users").where("status", ">", 0);
          lb.get()
          .catch(function(error) {
               //shows modal error if load for leaderboard fails
               $("#mainModal .modal-title").text(`Error while loading the leaderboard.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
          //event listener for when data changes on the leaderboard
          lb.onSnapshot(function(snapshot){
               snapshot.docChanges().forEach(function (change) {
                    //sets data for changed individual to an object
                    let aPlayer = {
                         name: change.doc.data().name,
                         userName: change.doc.id,
                         wins: change.doc.data().wins,
                         ties: change.doc.data().ties,
                         loses: change.doc.data().loses,
                         status: change.doc.data().status,
                         duelId: change.doc.data().duelId,
                         points: (change.doc.data().wins) - (change.doc.data().loses),
                         winPercent: change.doc.data().wins/(change.doc.data().wins + change.doc.data().loses + change.doc.data().ties)
                    };
                    //finds the object in the leaderboard array, if it exists, it replaces teh data, if not it adds tehm to teh leaderboard (a brand new player)
                    let ind = leaderBoard.findIndex(function(obj){
                         return obj.userName == aPlayer.userName;
                    });
                    if(ind == -1){
                         leaderBoard.push(aPlayer);
                    }else{
                         leaderBoard[ind] = aPlayer;
                    }
                    //fires off command to update leaderboard
                    gameControls.setLeaderBoard();
               })
          })
     }, 
     //function fires when the page loads to track all logged in players   
     syncPlayers: () =>{          
          db = firebase.firestore();
          //tracks all players keeps info on those with a staus greater than 1 (1 is offline)
          let curPlayers = db.collection("users").where("status", ">", 1);
          curPlayers.get()
          .catch(function(error) {
               //open modal window with error message
               $("#mainModal .modal-title").text(`Error while getting active users.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
          //event listener for when ever the data of a user changes
          curPlayers.onSnapshot(function(snapshot){
               snapshot.docChanges().forEach(function (change) {
                    //creates object for the data about the changed individual
                    let aPlayer = {
                         name: change.doc.data().name,
                         userName: change.doc.id,
                         wins: change.doc.data().wins,
                         ties: change.doc.data().ties,
                         loses: change.doc.data().loses,
                         status: change.doc.data().status,
                         duelId: change.doc.data().duelId,
                         challenger: change.doc.data().challenger
                    };
                    //if the user id is that of the perosnlogged in, set the mainuser varbile to the new player obect
                    if(mainUser.userName == aPlayer.userName){
                         mainUser = aPlayer;
                    }
                    //conditional for if the player just logged on
                    if (change.type === "added") {
                         //prevent an instance where the db updates without a username from putting the control on the screen 
                         if(change.doc.data().name != undefined){
                              aPlayer.duelId="";
                              gameControls.addPlayer(aPlayer);                                  
                         }                         
                    }
                    //conditional for when data is modified
                    if (change.type === "modified") {
                         gameControls.updatePlayer(aPlayer);
                         //if the status is 3 (being challenged) and the name is that of the personlogged in, open the challenge modal                        
                         if(aPlayer.status ==3 && mainUser.userName == aPlayer.userName){
                              gameControls.showChallenge();
                         }
                         //if the status is 5 (in a duel) and the name is that of the personlogged in, and the duel Id is not blank - start game                        
                         if(aPlayer.status ==5 && mainUser.userName == aPlayer.userName && aPlayer.duelId != ""){
                              gameControls.startGame();
                         }
                         //if in a duel as the original challenger and opponent leaves, stop rematch timer
                         if(aPlayer.status ==5 && mainUser.userName == aPlayer.userName && aPlayer.duelId == ""){
                              clearInterval(gameControls.theTimer);
                         }
                         //update player array
                         let ind = allPlayers.findIndex(function(obj){
                              return obj.userName == aPlayer.userName;
                         });
                         allPlayers[ind] = aPlayer;
                    }
                    //conditional for when data is modified
                    if (change.type === "removed") {
                         //remove the duel id from user and save to db
                         aPlayer.duelId="";
                         theStatus = db.collection('users').doc(curPlayer.docs[0].id).set({duelId:""}, { merge: true })
                         .catch(function(error) {
                              //open model with error
                              $("#mainModal .modal-title").text(`Error while removing duel id from logged out player.`);          
                              $("#mainModal .modal-body").text(error);
                              $("#mainModal .modal-footer").css("display","none");
                              $("#mainModal").modal(); 
                              return;                       
                         });
                         //removes player card
                         gameControls.removePlayer(aPlayer);
                         gameControls.resetCard();
                         //removes user from player array
                         allPlayers.filter(function(obj){
                              obj.userName != aPlayer.userName;
                         })
                    }
               });
          })
     }, 
     //function fires when the user clicks the log out or force logout button 
     logOut: async (userName, thisObj, force = false) => {
          db = firebase.firestore(); 
          //makes user forfit the game if in the middle of a duel
          if(thisObj.status == 5) {
               thisObj.loses++;      
               clearInterval(gameControls.theTimer);     
          }         
          //sets staus to offline and writes to db
          thisObj.status = 1;           
          let  theStatus = await db.collection('users').doc(userName);
          if(force){
               theStatus.set({
                    status: 1,
                    duelId:""
               }, { merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while logging out user.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                });
          }else{
               //pushes the loss count as well as oflline status
               theStatus.set({
                    status: 1,
                    wins: thisObj.wins,
                    loses: thisObj.loses,
                    ties:thisObj.ties,
                    duelId:""
               }, { merge: true }).catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while force log out user.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                });
          }
          //hides main controls of page and shows logn window
          gameControls.hideMainStage();
     },
     //function fires when the user clicks on a person in the online user list 
     issueChallenge: async (challenger, opponent) => {
          //looks at the status of the person clicked on if they are in a duel or bring challenged escape function
          let theStatus = allPlayers.find(function(arg){
               return arg.userName == opponent
          }).status;
          if (theStatus != 2)
          return;

          db = firebase.firestore();
          //finds plauer from allPlayers and sets them as myOpp 0 changes their status to 3 and player status to 4 and saves both
          myOpp = allPlayers.find(o => o.userName === opponent);
          myOpp.status = 3;
          challenger.status=4; 
          db.collection("challenges").add({
               opp1: mainUser.userName,
               opp2: myOpp.userName
          })
          //creates a challenge obj in the db and returns its id so it can be tracked - marks teh player as the challenger and therefore opp1 in the challenge object in the db
          .then(function(docRef){
               myOpp.duelId = docRef.id;
               mainUser.duelId = docRef.id;
               db.collection('users').doc(challenger.userName).set({
                    status: 4,
                    duelId:docRef.id,
                    challenger:true
               }, { merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while setting status of challenger to challenging.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               })
               .then(
                    db.collection('users').doc(opponent).set({
                         status: 3,
                         duelId:docRef.id,
                         challenger:false
                    }, { merge: true })
                    .catch(function(error) {
                         //displays modal dialog with error message
                         $("#mainModal .modal-title").text(`Error while changing status of challenged to challenged.`);          
                         $("#mainModal .modal-body").text(error);
                         $("#mainModal .modal-footer").css("display","none");
                         $("#mainModal").modal(); 
                         return;                       
                    }),
                    //starts a funciton that will monitor chnages on the challenge
                    fs.watchChallenge(docRef.id)
               )
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while adding a duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                })
               
               
          })
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while adding a challenge.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           })      
     },
     //function fires when the user clicks on a button that declines a challenge 
     rejectChallenge: async () => {
          db = firebase.firestore();
          //deletes teh challenge object, sets stauts of player and challenger to 2, wipes out the duel id, and closes the modal
          db.collection('challenges').doc(mainUser.duelId).delete()
          .then(db.collection('users').doc(myOpp.userName).set({
               status: 2,
               duelId:"",
               challenger:false
               }, { merge: true })
          )
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while setting status of challenged to online.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          })
          .then(
               db.collection('users').doc(mainUser.userName).set({
                    status: 2,
                    duelId:"",
                    challenger:false
               }, { merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while setting status of challenger to online.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while adding challenger status.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
     }, 
     //function fires when the user clicks on a button that accepts a challenge 
     acceptChallenge: async () => {
          //sets status of player and challenger to 5 and hides the modal
          db.collection('users').doc(myOpp.userName).set({
               status: 5,
               challenger: true
               }, { merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while setting status of challenged to in duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               })
          .then(
               db.collection('users').doc(mainUser.userName).set({
                    status: 5,
                    challenger: false
               }, { merge: true }).catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while setting status of challenger to in duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while setting challenger status to in duel.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
          //starts a funciton that will monitor chnages on the challenge
          fs.watchChallenge(mainUser.duelId);
     },
     //function fires when the user clicks on a r/p/s icon 
     setUserChoice: async (player, value) => {
          let  playerChoice = db.collection('challenges').doc(player.duelId);
          //tracks the click event on a r/p/s icon and records the value - uses the challenger variable in the player to determin if they are opp1 or opp2
          if(player.challenger){
               playerChoice.set({
                    opp1C : value,
                    challengeRematch:null,
                    rematchTo:null
               }, { merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while saving opponent 1 choice.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               });     
          }else{
               playerChoice.set({
                    opp2C : value,
                    challengeRematch:null,
                    rematchTo:null
               }, { merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while saving opponent 2 choice.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               });
          }
          
     },
     //function fires when the timer expires on teh cahllengers screen 
     checkWinner: async (player1, player2) => {
          //create two variables to track the who was the original challenger and the second opponent
          let challenger = player1.challenger == true ? player1 : player2;
          let opponent = player1.challenger == true ? player2 : player1;
          //goes ot to the db to get both individuals answers
          gameResult = await db.collection('challenges').doc(challenger.duelId).get()
          .then(function(doc){               
               let opp1C = doc.data().opp1C;
               let opp2C = doc.data().opp2C;

               let result = challenger.name == mainUser.name ? "You Won" : "You Lost";
               let retChoice = challenger.name != mainUser.name ? opp1C : opp2C;
               //evaluates the winner
               if(opp1C == opp2C && opp1C != null ){
                    challenger.ties++;
                    opponent.ties++;
                    result="You Tied"
               } else if( opp1C == null  || (opp1C == "rock" && opp2C == "paper") || (opp1C == "scissors" && opp2C == "rock") || (opp1C == "paper" && opp2C == "scissors") ){
                    challenger.loses++;
                    opponent.wins++;
                    result = challenger.name == mainUser.name ? "You Lost" : "You Won";
               }else{
                    challenger.wins++;
                    opponent.loses++;
               }
               //shows the results and shows rematch buttons
               gameControls.showResults(result, retChoice);
          })
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while checking the game results.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           });
     },
     //function fires when a challenge is issued but the user does not respond with 10 seconds or player exits duel after a win or loss
     removeDuel: (player1, player2) => {
          //deletes the challenge from the db
          let  duel = db.collection('challenges').doc(player1.duelId);
          duel.delete();
          //saves data for player 1
         db.collection('users').doc(player1.userName).set({
                    status : 2,
                    wins: player1.wins,
                    loses: player1.loses,
                    ties: player1.ties,
                    challengeRematch:null,
                    rematchTo:null,
                    challenger:false
               }, { merge: true }
          )
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while attempting to set player status to online after duel.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          })
          //saves data for player 2
          .then(function(){
               db.collection('users').doc(player2.userName).set({
                    status : 2,
                    wins: player2.wins,
                    loses: player2.loses,
                    ties: player2.ties,
                    challengeRematch:null,
                    rematchTo:null,
                    challenger:false
               }, { merge: true })
               .catch(function(error) {
                   //displays modal dialog with error message
                   $("#mainModal .modal-title").text(`Error while attempting to set player 2 status to online after duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               })
          });         
     },
     //function fires when a player in a duel requests a rematch 
     challengeRematch: () => {
          db = firebase.firestore();
          //updates challenge db object to show that a player has requested a rematch
          db.collection("challenges").doc(mainUser.duelId).set({
               challengeRematch :true,
               rematchTo: myOpp.userName,
               opp1C:null,
               opp2C:null
          }, {merge: true})
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while attempting to issue rematch challenge.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
     },
     //event listener that tracks when the challenge db obj has changed
     watchChallenge: (arg) =>{
          db = firebase.firestore();
          //get the challenge based on the id paddes into the function and eatch for changes
          let duel = db.collection("challenges").doc(arg);
          duel.get()
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while setting monitoring of game.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           });;
          duel.onSnapshot(function(snapshot){
               if(snapshot.data() == undefined){
                    gameControls.resetCard();
                    return;
               }
               //checks if the cahllenge was issued and the players name = the rematch to variable, show the rematch challenge
               if(snapshot.data().challengeRematch == true && mainUser.userName == snapshot.data().rematchTo){
                    gameControls.promptRematch()
               }
          })          
     },
     //function fires when a player in a accepts a rematch 
     rematchAccpeted: () => {
          //save the players data to the db 
          db.collection("users").doc(mainUser.userName).set({
               wins: mainUser.wins,
               loses: mainUser.loses,
               ties: mainUser.ties,
               challengeRematch:"",
               rematchTo:""
          }, {merge: true })
          .catch(function(error) {
               //displays modal dialog with error message
               $("#mainModal .modal-title").text(`Error while attempting to save results after duel.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          })
          .then(function(){
               //save the opponents data to the db 
               db.collection("users").doc(myOpp.userName).set({
                    wins: myOpp.wins,
                    loses: myOpp.loses,
                    ties: myOpp.ties,
                    challengeRematch:"",
                    rematchTo:""
               }, {merge: true })
               .catch(function(error) {
                    //displays modal dialog with error message
                    $("#mainModal .modal-title").text(`Error while attempting to save player 2 results after duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               });
          })
     }
}


