// choose one time payment tab:
setTimeout(function() { 
    document.getElementById('RH2017OtherAmountBtn').click();
  }, 2000);

// pay 10 shekel
setTimeout(function() { document.getElementById('page2_tab-3').querySelector("input").value = {{formattedPrice}};}, 3000);


setTimeout(function() { document.getElementById('RH2017ContinueDonate').click();}, 4000);

setTimeout(function() {document.getElementById('close_popup').click();}, 5000);

// make sure its 10
//document.forms[1][0].value = 10;  i can assert this to make sure its what im paying
setTimeout(function() {document.getElementsByName("email")[0].value = '{{email}}';document.getElementsByName("firstName")[0].value = "user";document.getElementsByName("phone")[0].value = "0540000000";  document.getElementsByClassName('clearfix2 prettycheckbox labelright  blue')[1].querySelectorAll("a")[0].className = "";},6000);


setTimeout(function(){document.getElementById('page3_inputs_submits_next').click();},7000);


setTimeout(function() { 
//creditcardinfo
    document.getElementById('ccno').value = "1234123412341234";
    document.getElementById('expmonth').selectedIndex = "2";
    document.getElementById('expyear').value = "21";
    document.getElementById('myid').value = "123456789";
    document.getElementById('mycvv').value = "000";
}, 8000);

setTimeout(function() { 
    document.getElementById('submitbtn').click(); // submit
}, 9000);