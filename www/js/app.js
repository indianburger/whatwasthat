var indexPageReady = $.Deferred(),
  phonegapReady = $.Deferred();
  
// jqm ready
$(document).on("pageinit", "#index", indexPageReady.resolve);

// phonegap ready
document.addEventListener("deviceready", phonegapReady.resolve, false);

function uploadPhoto(imageURI, done) {
  function fail(err) {
    console.error("Image failed to upload! Errorcode: " + err.code);
  }

  var opts = new FileUploadOptions();
  opts.fileKey  = "file";
  opts.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1) + ".jpeg";
  opts.mimeType = "image/jpeg";
  opts.params   = {};

  var ft = new FileTransfer();
  ft.upload(imageURI, "http://192.168.1.113:3000/file-upload", done, fail, opts);
}

function showPhoto(imageURI) {
  $.mobile.changePage('#show-image');
  localStorage.imageURI = imageURI;
}

if (!window.Phonegap) {
  phonegapReady.resolve();
}
$.when(indexPageReady, phonegapReady).then(function appStart() {
  function getPictureFail(err) {
    console.error("Get picture failed. Error: " + err);
  }
  
  $('#camera').on('tap', function() {
    navigator.camera.getPicture(showPhoto, getPictureFail, { 
      destinationType : navigator.camera.DestinationType
    });
  });
  
  $('#gallery').on('tap', function() {
    navigator.camera.getPicture(showPhoto, getPictureFail, { 
      destinationType : navigator.camera.DestinationType.FILE_URI,
      sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
    });
  });
  
  
  $('#browser-image-form').submit(function() {
    var formData = new FormData($('#browser-image-form')[0]);
    
    $.ajax({
      url: '/file-upload',  //server script to process data
      type: 'POST',
      data: formData,
      //Options to tell JQuery not to process data or worry about content-type
      cache: false,
      contentType: false,
      processData: false
    }).success(showPhoto)
    .error(function() {
      console.log("error");
    });
    
    return false;
  });
});

$(document).one("pageinit", "#show-image", function() {
  $('.crop').on('tap', function cropHandler() {
    var x, y,
      $sourceImage = $('#source-image'),
      path = $sourceImage.attr('src');
    
    var heightScale = $sourceImage.height() / $sourceImage.data('original-height');
    var widthScale = $sourceImage.width() / $sourceImage.data('original-width');
    function submitPhotoToDetect() {
      $.post("/submitPhotoToDetect", {
        path: path,
        x: x / widthScale,
        y: y / heightScale,
        width: $('#overlay').width() / widthScale,
        height: $('#overlay').height() / heightScale
      }).success(function success(data) {
        console.log("success! data: " + data);
      }).error(function(err) {
        console.log("error!: " + err.responseText);
      });
    }
    
    if (this.id === 'crop-it') {
      x = $('#overlay').offset().left;
      y = $('#overlay').offset().top;
    }
    if (window.Phonegap) {
      uploadPhoto(path, submitPhotoToDetect);
    } else {
      submitPhotoToDetect();
    }
    
    
  });
  
});

// function cropPhoto(image)

$(document).on("pagechange", function(event, data) {
  switch(data.toPage[0].id) {
    case "show-image":
      showImagePageChange();
      break;
  }
});

function showImagePageChange(){
  var $overlay = $('#overlay');
  var $sourceImage;
  function setOverlay(){
    $sourceImage.
      data("original-width", $sourceImage[0].width).
      data("original-height", $sourceImage[0].height);
    
    $('#source-image').remove();
    $("#source-image-container").append($sourceImage);
    
    $overlay.width($sourceImage.width() / 2).
      height($sourceImage.height() / 2).
      css('visibility', 'visible');
    $('#overlay').pep({
      constrainToParent: true
    });
  }
  $sourceImage = $('<img>').
    attr('src', localStorage.imageURI).
    attr('id', "source-image").
    on('load', setOverlay);
  //setup for overlay
  


  
}

