var counter = 0;
    $(document).on("click", "#addbtn", function () {
      counter = $('.nvoice-qty-pric').length;

      if (counter) {
        $("#rmbtn").css('display', 'block')
      }
      var div = $("#nvoice-qty-pric-0").clone();
      div.find('input,textarea').each(function (e) {
        $(this).val('')
      })
      div.appendTo("#second_form");
      $('.nvoice-qty-pric').each(function (v, i) {
        $(this).attr("id", "nvoice-qty-pric-" + v)
        if (counter > 0)
          $(this).find('button').show()
        else
          $(this).find('button').hide()
      });
    });
    $(document).on("click", ".closeRandSect", function () {

      $(this).parent("div").remove()
      counter = $('.nvoice-qty-pric').length;
      $('.nvoice-qty-pric').each(function (v, i) {
        $(this).attr("id", "nvoice-qty-pric-" + v)
        if (counter > 1)
          $(this).find('button').show()
        else
          $(this).find('button').hide()
      })
    })
function SubmitV(e) {
  $("form").submit(function (e) {
    e.preventDefault();
  });

  $('#issuedateErr').html("")
  if ($('#issuedate').val() == "") {
    $('#issuedateErr').html("<span style='color:red'>Issuedate is required</span>")
    return false
  }
  
  $('#duedateErr').html("")
  if ($('#duedate').val().length < 1) {
    $('#duedateErr').html("<span style='color:red'>Duedate is required</span>")

    return false

  }

  if ($('#name').val().length < 1) {
    $('#nameErr').html("<span style='color:red'>Name is required</span>")
    return false
  }

  $('#nameErr').html("")
  if ($('#quantity').val().length < 1) {
    $('#quantityErr').html("<span style='color:red'>Quantity is required</span>")
    return false
  }
  $('#quantityErr').html("")
  if (Number($('#quantity').val()) < 0) {
    $('#quantityErr').html("<span style='color:red'>Quantity is invalid</span>")
    return false
  }
  $('#quantityErr').html("")
  if ($('#price').val().length < 1) {
    $('#priceErr').html("<span style='color:red'>Price is required</span>")
    return false
  }

  $('#priceErr').html("")
  if (Number($('#price').val()) < 0) {
    $('#priceErr').html("<span style='color:red'>Price is invalid</span>")
    return false
  }

  $('#duedateErr').html("")
  if ($('#issuedate').val() > $('#duedate').val()) {
    $('#duedateErr').html("<span style='color:red'>Duedate Should Be Greater Than Issuedate</span>")

    return false
  }

}