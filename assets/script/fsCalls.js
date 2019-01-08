let fs = {
      
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
          if(potentialNew.size > 0){
               $("#tboxUserName").val("");
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("The User ID you have entered already exsits");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
               return;
          }       
          thisObj.name= theName,
          thisObj.userName= theId,
          thisObj.wins= 0,
          thisObj.ties= 0,
          thisObj.loses= 0,
          thisObj.status= 2
          db.collection("users").doc(theId).set({
               name: thisObj.name,
               wins: thisObj.wins,
               ties: thisObj.ties,
               loses: thisObj.loses,
               status: thisObj.status
          })
          .then(function(docRef){
               console.log(docRef.id);
          })
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while saving new users.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           });        
          gameControls.showMainStage(thisObj);
     },
     getUserId: async (userId, thisObj) => { 
          db = firebase.firestore();         
          curPlayer = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", userId).get()
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while logging in.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           });
          if(curPlayer.size == 1 && curPlayer.docs[0].data().status != 1){
               thisObj.status = 1;
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Someone is logged in under that name.");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal .modal-footer.forceLogout").css("display", "block");
               $("#mainModal").modal();
          }else if(curPlayer.size == 1 && (curPlayer.docs[0].data().status == 1)){
               thisObj.status = 2;                
               let  theStatus = db.collection('users').doc(curPlayer.docs[0].id);
               theStatus.set({
                   status: 2
               }, { merge: true })
               .catch(function(error) {
                    $("#mainModal .modal-title").text(`Error while setting status of user to logged in.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                });
               thisObj.dbID = curPlayer.docs[0].id;
               thisObj.userName = curPlayer.docs[0].id;
               thisObj.name = curPlayer.docs[0].data().name;
               thisObj.wins = curPlayer.docs[0].data().wins;
               thisObj.loses = curPlayer.docs[0].data().loses;
               thisObj.ties = curPlayer.docs[0].data().ties;
               gameControls.showMainStage(curPlayer.docs[0].data());
          }else if(curPlayer.size == 0){
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Username does not exist");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
          }
     },
     getLeaderboard: () => {
          db = firebase.firestore();
          let lb = db.collection("users").where("status", ">", 0);
          lb.get()
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while loading the leaderboard.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           });;
          lb.onSnapshot(function(snapshot){
               snapshot.docChanges().forEach(function (change) {
                    let aPlayer = {
                         name: change.doc.data().name,
                         userName: change.doc.id,
                         wins: change.doc.data().wins,
                         ties: change.doc.data().ties,
                         loses: change.doc.data().loses,
                         status: change.doc.data().status,
                         duelId: change.doc.data().duelId,
                         points: (change.doc.data().wins*2) + (change.doc.data().ties),
                         winPercent: change.doc.data().wins/(change.doc.data().wins + change.doc.data().loses + change.doc.data().ties)
                    };
                    let ind = leaderBoard.findIndex(function(obj){
                         return obj.userName == aPlayer.userName;
                    });
                    if(ind == -1){
                         leaderBoard.push(aPlayer);
                    }else{
                         leaderBoard[ind] = aPlayer;
                    }
                    gameControls.setLeaderBoard();
               })
          })
     },    
     syncPlayers: () =>{          
          db = firebase.firestore();
          let curPlayers = db.collection("users").where("status", ">", 1);
          curPlayers.get()
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while getting active users.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           });
          curPlayers.onSnapshot(function(snapshot){
               snapshot.docChanges().forEach(function (change) {
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
                    if (change.type === "added") {
                         if(change.doc.data().name != undefined){
                              aPlayer.duelId="";
                              gameControls.addPlayer(aPlayer);                                  
                         }                         
                    }
                    if (change.type === "modified") {
                         gameControls.updatePlayer(aPlayer);                        
                         if(aPlayer.status ==3 && mainUser.userName == aPlayer.userName){
                              mainUser = aPlayer;                             
                              gameControls.showChallenge();
                         }
                         if(aPlayer.status ==4 && mainUser.userName == aPlayer.userName){
                              mainUser = aPlayer;
                         }
                         if(aPlayer.status ==5 && mainUser.userName == aPlayer.userName && aPlayer.duelId != ""){
                              mainUser = aPlayer; 
                              gameControls.startGame();
                         }
                         if(aPlayer.status ==5 && mainUser.userName == aPlayer.userName && aPlayer.duelId == ""){
                              aPlayer.wins++;
                              db.collection('users').doc(curPlayer.docs[0].id).set({duelId:"", status:2, wins:aPlayer.wins}, { merge: true })
                              .catch(function(error) {
                                   $("#mainModal .modal-title").text(`Error while awarding win due to opponent logout.`);          
                                   $("#mainModal .modal-body").text(error);
                                   $("#mainModal .modal-footer").css("display","none");
                                   $("#mainModal").modal(); 
                                   return;                       
                               });
                              clearInterval(gameControls.theTimer);
                         }
                         let ind = allPlayers.findIndex(function(obj){
                              return obj.userName == aPlayer.userName;
                         });
                         allPlayers[ind] = aPlayer;
                    }
                    if (change.type === "removed") {
                         aPlayer.duelId="";
                         theStatus = db.collection('users').doc(curPlayer.docs[0].id).set({duelId:""}, { merge: true })
                         .catch(function(error) {
                              $("#mainModal .modal-title").text(`Error while removing duel id from logged out player.`);          
                              $("#mainModal .modal-body").text(error);
                              $("#mainModal .modal-footer").css("display","none");
                              $("#mainModal").modal(); 
                              return;                       
                          });
                         gameControls.removePlayer(aPlayer);
                         gameControls.resetCard();
                         allPlayers.filter(function(obj){
                              obj.userName != aPlayer.userName;
                         })
                    }
               });
          })
     }, 
     logOut: async (userName, thisObj, force = false) => {
          db = firebase.firestore(); 
          if(thisObj.status == 5) {
               console.log(`${thisObj.name} will forefit`);  
               thisObj.loses++;      
               clearInterval(gameControls.theTimer);     
          }         
          thisObj.status = 1;           
          let  theStatus = await db.collection('users').doc(userName);
          if(force){
               theStatus.set({
                    status: 1,
                    duelId:""
               }, { merge: true })
               .catch(function(error) {
                    $("#mainModal .modal-title").text(`Error while logging out user.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                });
          }else{
               theStatus.set({
                    status: 1,
                    wins: thisObj.wins,
                    loses: thisObj.loses,
                    ties:thisObj.ties,
                    duelId:""
               }, { merge: true }).catch(function(error) {
                    $("#mainModal .modal-title").text(`Error while force log out user.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                });
          }
                    
          gameControls.hideMainStage();
     },
     issueChallenge: async (challenger, opponent) => {
          let theStatus = allPlayers.find(function(arg){
               return arg.userName == opponent
          }).status;
          if (theStatus != 2)
          return;
          db = firebase.firestore();
          myOpp = allPlayers.find(o => o.userName === opponent);
          myOpp.status = 3;
          challenger.status=4; 
          db.collection("challenges").add({
               opp1: mainUser.userName,
               opp2: myOpp.userName
          })
          .then(function(docRef){
               myOpp.duelId = docRef.id;
               mainUser.duelId = docRef.id;
               db.collection('users').doc(challenger.userName).set({
                    status: 4,
                    duelId:docRef.id,
                    challenger:true
               }, { merge: true })
               .catch(function(error) {
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
                         $("#mainModal .modal-title").text(`Error while changing status of challenged to challenged.`);          
                         $("#mainModal .modal-body").text(error);
                         $("#mainModal .modal-footer").css("display","none");
                         $("#mainModal").modal(); 
                         return;                       
                     }),
                    fs.watchChallenge(docRef.id)
               )
               .catch(function(error) {
                    $("#mainModal .modal-title").text(`Error while adding a duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
                })
               
               
          })
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while adding a challenge.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
           })      
     },
     rejectChallenge: async () => {
          db = firebase.firestore();
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
                    $("#mainModal .modal-title").text(`Error while setting status of challenger to online.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while adding challenger status.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
     }, 
     acceptChallenge: async () => {
          db.collection('users').doc(myOpp.userName).set({
               status: 5,
               challenger: true
               }, { merge: true })
               .catch(function(error) {
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
                    $("#mainModal .modal-title").text(`Error while setting status of challenger to in duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while setting challenger status to in duel.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
          fs.watchChallenge(mainUser.duelId);
     },
     setUserChoice: async (player, value) => {
          let  playerChoice = db.collection('challenges').doc(player.duelId);
          if(player.challenger){
               playerChoice.set({
                    opp1C : value,
                    challengeRematch:null,
                    rematchTo:null
               }, { merge: true })
               .catch(function(error) {
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
                    $("#mainModal .modal-title").text(`Error while saving opponent 2 choice.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               });
          }
          
     },
     checkWinner: async (player1, player2) => {
          let challenger = player1.challenger == true ? player1 : player2;
          let opponent = player1.challenger == true ? player2 : player1;
          gameResult = await db.collection('challenges').doc(challenger.duelId).get()
          .then(function(doc){               
               let opp1C = doc.data().opp1C;
               let opp2C = doc.data().opp2C;
               let result = challenger.name == mainUser.name ? "You Won" : "You Lost";
               let retChoice = challenger.name != mainUser.name ? opp1C : opp2C;
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
     removeDuel: (player1, player2) => {
          let  duel = db.collection('challenges').doc(player1.duelId);
          duel.delete();

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
               $("#mainModal .modal-title").text(`Error while attempting to set player status to online after duel.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          })
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
                    $("#mainModal .modal-title").text(`Error while attempting to set player 2 status to online after duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               })
          });         
     },
     challengeRematch: () => {
          db = firebase.firestore();
          let curDuel = db.collection("challenges").doc(mainUser.duelId).set({
               challengeRematch :true,
               rematchTo: myOpp.userName,
               opp1C:null,
               opp2C:null
          }, {merge: true})
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while attempting to issue rematch challenge.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          });
     },
     watchChallenge: (arg) =>{
          db = firebase.firestore();
          let duel = db.collection("challenges").doc(arg);
          duel.get()
          .catch(function(error) {
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
               if(snapshot.data().challengeRematch == true && mainUser.userName == snapshot.data().rematchTo){
                    gameControls.promptRematch()
               }
          })          
     },
     rematchAccpeted: () => {
          db.collection("users").doc(mainUser.userName).set({
               wins: mainUser.wins,
               loses: mainUser.loses,
               ties: mainUser.ties,
               challengeRematch:"",
               rematchTo:""
          }, {merge: true })
          .catch(function(error) {
               $("#mainModal .modal-title").text(`Error while attempting to save results after duel.`);          
               $("#mainModal .modal-body").text(error);
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal(); 
               return;                       
          })
          .then(function(){
               db.collection("users").doc(myOpp.userName).set({
                    wins: myOpp.wins,
                    loses: myOpp.loses,
                    ties: myOpp.ties,
                    challengeRematch:"",
                    rematchTo:""
               }, {merge: true })
               .catch(function(error) {
                    $("#mainModal .modal-title").text(`Error while attempting to save player 2 results after duel.`);          
                    $("#mainModal .modal-body").text(error);
                    $("#mainModal .modal-footer").css("display","none");
                    $("#mainModal").modal(); 
                    return;                       
               });
          })
     }
}


