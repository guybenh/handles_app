

LATET_SCRIPT = [["""setTimeout(function(){document.getElementById('RH2017OtherAmountBtn').click();}, 2000);""",
             """window.ReactNativeWebView.postMessage({{pageNumber}});""",
             """setTimeout(function() { document.getElementById('page2_tab-3').querySelector("input").value = {{formattedPrice}};}, 3000);""",
             """setTimeout(function() { document.getElementById('RH2017ContinueDonate').click();}, 4000);""",
             """setTimeout(function() {document.getElementById('close_popup').click();}, 5000);""",
             """setTimeout(function() {document.getElementsByName("email")[0].value = '{{email}}';document.getElementsByName("firstName")[0].value = "user";document.getElementsByName("phone")[0].value = "0540000000";  document.getElementsByClassName('clearfix2 prettycheckbox labelright  blue')[1].querySelectorAll("a")[0].className = "";},6000);""",
             """setTimeout(function(){document.getElementById('page3_inputs_submits_next').click();},7000);"""]]


GLOBUS_SCRIPT = [[
    """window.ReactNativeWebView.postMessage({{pageNumber}});""",
    """setTimeout(function(){document.querySelectorAll('a')[0].click();},3000);"""
]]