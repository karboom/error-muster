$.fn.api.settings.onFailure= function(response) {
    if(response && response.success) {
        return response.success;
    }
    reason = response.getResponseHeader('X-Error-Description');
    reason = encodeURIComponent(reason)

    alert(reason)
    return false;
};