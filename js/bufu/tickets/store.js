var bufu_lastVisible = 0;
var bufu_priceNormal = 0;
var bufu_priceSpecial = 0;
var bufu_canSubmit = false;

var bufu_custom_options_price_add = 0;

var bufu_productId = 0;

function bufu_tickets_showEvent(id, avail, np, sp, spa)
{
	if (id != bufu_lastVisible) {
		eventItem = $('bufu_tickets-selectbox-event-'+id);
		if (eventItem) {
			Element.addClassName(eventItem, 'selected');
			Element.addClassName($('bufu_tickets-selectbox-item-'+id), 'selected');
		}
		lastEventItem = $('bufu_tickets-selectbox-event-'+bufu_lastVisible);
		if (lastEventItem) {
			Element.removeClassName(lastEventItem, 'selected');
			Element.removeClassName($('bufu_tickets-selectbox-item-'+bufu_lastVisible), 'selected');
		}
		
		if (spa == false) {
			// hide special price
			$('bufu_tickets_specialPriceNum').hide();
		} else {
			// show special price
			$('bufu_tickets_specialPriceNum').show();
		}
		
		// set price labels for normal and special price tickets
		bufu_priceNormal = parseFloat(np.replace(",", "."));
		bufu_priceSpecial = parseFloat(sp.replace(",", "."));
		$('bufu_tickets-normalPricePerTicket').innerHTML = bufu_helper_number_format(np, 2, ',', ".");
		$('bufu_tickets-specialPricePerTicket').innerHTML = bufu_helper_number_format(sp, 2, ',', ".");

		// reset amounts of selected cards
		$('bufu_tickets-normal').value = "";
		$('bufu_tickets-special').value = "";
		
		// reset total sum
		bufu_tickets_updatePriceLabels(true);
		bufu_canSubmit = false;
		
		// show / hide for abendkasse and soldout statuses
		if (avail == 0 || avail == 3) {
			Element.addClassName($('bufu_tickets-addToCart'), 'hidden');
		} else {
			Element.removeClassName($('bufu_tickets-addToCart'), 'hidden');
		}

		$('bufu_tickets-eventId').value = id;
		bufu_lastVisible = id;
	}
	return false;
}

function bufu_tickets_setProductId(id)
{
	bufu_productId = id;
}

function bufu_tickets_updatePriceLabels(reset)
{
	n = parseInt($('bufu_tickets-normal').value, 10);
	s = parseInt($('bufu_tickets-special').value, 10);
	
	if (isNaN(n) || reset) {
		n = 0;
	}
	if (isNaN(s) || reset) {
		s = 0;
	}
	finalPrice = n*(bufu_priceNormal+bufu_custom_options_price_add) + s*(bufu_priceSpecial+bufu_custom_options_price_add);
	if (n > 0 || s > 0) {
		bufu_canSubmit = true;
		$('bufu_tickets-submitBtn').removeClassName('submit-disabled');
	}
	else {
		$('bufu_tickets-submitBtn').addClassName('submit-disabled');
		bufu_canSubmit = false;
	}
	priceStr = bufu_helper_number_format(finalPrice, 2, ',', ".");
	$('bufu_tickets-currentTotalPrice').innerHTML = priceStr;
	$('bufu_tickets-totalPriceBox').show();
	
	// update mage price label as well
	$('product-price-'+bufu_productId).innerHTML = '<span class="price">'+priceStr+' €</span>';
}

function bufu_tickets_cartFormSubmit()
{
	if (bufu_canSubmit) {
		// alter form action to point to bufu_tickets controller
		productAddToCartForm.form.action = productAddToCartForm.form.action.replace("checkout", "bufu_tickets");
		productAddToCartForm.submit();
	}
}

function bufu_helper_number_format(number, decimals, dec_point, thousands_sep) {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');    }
    return s.join(dec);
}

function bufu_add_custom_options_price_update() {
	$$('.product-custom-option').each(function(element){
		element.observe('change', bufu_custom_options_price_update);
	});
}

function bufu_custom_options_price_update() {
	config = opConfig.config;
	price = 0;
	$$('.product-custom-option').each(function(element){
		var optionId = 0;
		element.name.sub(/[0-9]+/, function(match){
			optionId = match[0];
		});
		if (this.config[optionId]) {
			if (element.type == 'checkbox' || element.type == 'radio') {
				if (element.checked) {
					if (config[optionId][element.getValue()]) {
						price += parseFloat(config[optionId][element.getValue()]);
					}
				}
			} else if(element.hasClassName('datetime-picker') && !skipIds.include(optionId)) {
				dateSelected = true;
				$$('.product-custom-option[id^="options_' + optionId + '"]').each(function(dt){
					if (dt.getValue() == '') {
						dateSelected = false;
					}
				});
				if (dateSelected) {
					price += parseFloat(this.config[optionId]);
					skipIds[optionId] = optionId;
				}
			} else if(element.type == 'select-one' || element.type == 'select-multiple') {
				if (element.options) {
					$A(element.options).each(function(selectOption){
						if (selectOption.selected) {
							if (this.config[optionId][selectOption.value]) {
								price += parseFloat(this.config[optionId][selectOption.value]);
							}
						}
					});
				}
			} else {
				if (element.getValue().strip() != '') {
					price += parseFloat(this.config[optionId]);
				}
			}
		}
	});
	try {
		bufu_custom_options_price_add = price;
		bufu_tickets_updatePriceLabels();
	}catch (e) {

    }
}