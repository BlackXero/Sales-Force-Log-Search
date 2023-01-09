let sheetObj = null;
$(document).ready(function(){
    $('#spreadSheetDiv').hide();
});
function postRequest(url, data, callbackSuccess) {
    $.ajax({
        method: 'post',
        url: url,
        data: data,
        success: callbackSuccess,
        timeout:180000,
        beforeSend: function () {
            $('#loader-div').show();
        },
        complete: function () {
            $('#loader-div').hide();
        },
        error: function (error) {
            return Swal.fire(error);
        }
    });
}

function goBack(){
    $('#spreadSheetDiv').hide();
    $('#queryTextArea').show();
}
function downloadRecords(){
    sheetObj.download();
}