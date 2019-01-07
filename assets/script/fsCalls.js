let fs = {
     trackingStarted:false,
     obj: this,       
     newUser: async (theName, theId, thisObj) =>{
          db = firebase.firestore();        
          potentialNew = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", theId).get();
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
               console.error("Error adding document: ", error);
          })         
          gameControls.showMainStage(thisObj);
     },
     getUserId: async (userId, thisObj) => { 
          db = firebase.firestore();         
          curPlayer = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", userId).get();
          if(curPlayer.size == 1 && curPlayer.docs[0].data().status != 1){
               thisObj.status = 1;
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Someone is logged in under that name.");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
          }else if(curPlayer.size == 1 && (curPlayer.docs[0].data().status == 1)){
               thisObj.status = 2;                
               let  theStatus = db.collection('users').doc(curPlayer.docs[0].id);
               theStatus.set({
                   status: 2
               }, { merge: true });
               thisObj.dbID = curPlayer.docs[0].id;
               thisObj.userName = curPlayer.docs[0].id;
               thisObj.name = curPlayer.docs[0].data().name;
               gameControls.showMainStage(curPlayer.docs[0].data());
          }else if(curPlayer.size == 0){
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Username does not exist");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
          }
     },
     syncPlayers: () =>{          
          db = firebase.firestore();
          let curPlayers = db.collection("users").where("status", ">", 1);
          curPlayers.get();
          curPlayers.onSnapshot(function(snapshot){
               snapshot.docChanges().forEach(function (change) {
                    let aPlayer = {
                         name: change.doc.data().name,
                         userName: change.doc.id,
                         wins: change.doc.data().wins,
                         ties: change.doc.data().ties,
                         loses: change.doc.data().loses,
                         status: change.doc.data().status,
                         duelId: change.doc.data().duelId
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
                         if(aPlayer.status ==5 && mainUser.userName == aPlayer.userName){
                              gameControls.startGame();
                         }
                    }
                    if (change.type === "removed") {
                         aPlayer.duelId="";
                         theStatus = db.collection('users').doc(curPlayer.docs[0].id).set({duelId:""}, { merge: true })
                         gameControls.removePlayer(aPlayer);
                         gameControls.resetCard();
                    }
               });
          })
     }, 
     logOut: async (userName, thisObj) => {
          db = firebase.firestore();          
          thisObj.status = 1; 
          let  theStatus = await db.collection('users').doc(userName);
          let  setWithMerge = theStatus.set({
               status: 1
          }, { merge: true });          
          gameControls.hideMainStage();
     },
     issueChallenge: async (challenger, opponent, theFunc = this.obj) => {
          challenger.challenger = true;
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
                    duelId:docRef.id
               }, { merge: true })
               .then(
                    db.collection('users').doc(opponent).set({
                         status: 3,
                         duelId:docRef.id
                    }, { merge: true }),
                    fs.watchChallenge(docRef.id)
               )
               .catch(function(error) {
                    console.error("Error adding challenger status: ", error);
               });
               
               
          })
          .catch(function(error) {
               console.error("Error adding challenge: ", error);
          })         
     },
     rejectChallenge: async () => {
          mainUser.challenger = false;
          db = firebase.firestore();
          db.collection('challenges').doc(mainUser.duelId).delete()
          .then(db.collection('users').doc(myOpp.userName).set({
               status: 2,
               duelId:""
               }, { merge: true })
          )
          .then(
               db.collection('users').doc(mainUser.userName).set({
                    status: 2,
                    duelId:""
               }, { merge: true }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               console.error("Error adding challenger status: ", error);
          });
     }, 
     acceptChallenge: async () => {
          mainUser.challenger = false;
          db.collection('users').doc(myOpp.userName).set({
               status: 5,
               }, { merge: true })
          .then(
               db.collection('users').doc(mainUser.userName).set({
                    status: 5,
               }, { merge: true }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               console.error("Error adding challenger status: ", error);
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
               }, { merge: true });
     
          }else{
               playerChoice.set({
                    opp2C : value,
                    challengeRematch:null,
                    rematchTo:null
               }, { merge: true });
     
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
                    rematchTo:null
               }, { merge: true }
          )
          .then(function(){
               db.collection('users').doc(player2.userName).set({
                    status : 2,
                    wins: player2.wins,
                    loses: player2.loses,
                    ties: player2.ties,
                    challengeRematch:null,
                    rematchTo:null
               }, { merge: true })
          });         
     },
     challengeRematch: () => {
          db = firebase.firestore();
          let curDuel = db.collection("challenges").doc(mainUser.duelId).set({
               challengeRematch :true,
               rematchTo: myOpp.userName,
               opp1C:null,
               opp2C:null
          }, {merge: true});
     },
     watchChallenge: (arg) =>{
          db = firebase.firestore();
          let duel = db.collection("challenges").doc(arg);
          duel.get();
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
          .then(function(){
               db.collection("users").doc(myOpp.userName).set({
                    wins: myOpp.wins,
                    loses: myOpp.loses,
                    ties: myOpp.ties,
                    challengeRematch:"",
                    rematchTo:""
               }, {merge: true });
          })
     }
}


