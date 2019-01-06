let allPlayers = [];
const statusIcons ={
     2:"online",
     3:"challenge",
     4:"challenge",
     5:"fight"
}
let mainUser = {
     status:1,
     name: "",
     userName:"",
     wins:0,
     loses:0,
     duelId:""
};
let myOpp = {
     status:1,
     name: "",
     userName:"",
     wins:0,
     loses:0,
     duelId:""
};

let gameControls = {
     showMainStage: player =>{
          $("#mainGame").css("display", "block");
          $("#login").addClass("loggedIn");
          $("#curPlayer h2").text(player.name);
     },
     hideMainStage: () =>{
          $("#mainGame").css("display", "none");
          $("#login").removeClass("loggedIn");
          $("#login input[type='text']").val("");
          $("#players .card-body").html("");
          $("#loginSection").css("display", "block");
          $("#newUserSection").css("display", "none");
     },
     addPlayer: player => {
          let existplayer = allPlayers.find(o => o.userName === player.userName);
          if(!existplayer){
               allPlayers.push(player);
               let playerCard = $("<div class='aPlayer online'>").html(player.name);
               playerCard.attr("data-user",player.userName);
               $("#players .card-body").append(playerCard);
          }
     },
     updatePlayer: player => {
          let playerIndex = allPlayers.findIndex(o => o.userName === player.userName);
          if(playerIndex > -1){
               allPlayers[playerIndex] = player;
               $(`*[data-user="${player.userName}"]`).html(`${player.name}`).attr("class", "aPlayer").addClass(statusIcons[player.status]);


          }else{
               allPlayers.push(player);
          }
     },
     removePlayer: player => {
          $(`*[data-user="${player.userName}"]`).remove();
          allPlayers = allPlayers.filter(obj => obj.userName != player.userName);
     },
     showChallenge: () =>{
          myOpp = allPlayers.find(o => o.duelId == mainUser.duelId && o.userName != mainUser.userName);
          $("#mainModal .modal-title").text(`Challenge issued`);
          $("#mainModal .modal-body").text(`You have been challenged by ${myOpp.name}`);
          $("#mainModal .modal-footer").css("display","block");
          $("#mainModal").modal(); 
     }
};

