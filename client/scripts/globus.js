// what can work:

//url: 

var url = 'https://www.globes.co.il/news/m/purchase/';


//page 0
document.querySelectorAll('a')[0].click()// this select the first url and clicks it, if user already clicked it it should go straight to second page

// page 1
document.getElementById("email").value = "ash@handles.com";
document.getElementById("password1").value = "abc";
document.getElementById("password2").value = document.getElementById("password1").value;

//page 2
document.getElementById("first_name").value = "asher"
document.getElementById("last_name").value = "gued"
document.getElementById("mobile").value = "0547678139"
document.getElementById("btn_continue").click()