$(function(){
  $("#header").load("../common/header.html", function (){
    $(".nav_sp_open, .nav_sp_close").on("click", function () {
      console.log("clicked")
      $(".nav_sp").toggleClass("fade show");
      $(".nav_sp_open").toggleClass("hide");
    });
  });
  $("#footer").load("../common/footer.html");
})