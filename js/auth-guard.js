(function(){

  const eventData = localStorage.getItem("currentEvent");

  if(!eventData){
    alert("Anda belum login.");
    window.location.href = "/";
    return;
  }

})();
