/*
 * Options:
 *
 *  rangeChooserFormSel (required):
 *    Form container selector
 *    Example: #searchForm
 *
 *  stateful (optional):
 *    Saves state to localStorage
 *    default=false
 *    value=[true|false]
 *
 *  maximumDateRange (optional):
 *    Disallows dates out of specified range
 *    default: no maximum date range
 *    Object:
 *      years
 *      months
 *      weeks
 *      days
 *    Example: {years: 1 months:2}
 *
 *  allowNoneTimePeriod (optional):
 *    Adds the none-specified option to the periodType select
 *    default=false
 *    values=[true|false]
 */

(function($) {
    var methods = {
      init: function(options) {

        var _options = $.extend(
          {
            stateful: false,
            allowNoneTimePeriod: false,
            stateId: "timePeriodChooser:"+$(location).attr('pathname')
          },
          options);

        var rangeChooser = $(this);
        var rangeChooserForm = $(_options.rangeChooserFormSel);

        var periodType = rangeChooserForm.find(".rangeChooser_periodType input");
        var rangeStart = rangeChooserForm.find(".rangeChooser_start input");
        var rangeEnd = rangeChooserForm.find(".rangeChooser_end input");

        if (rangeChooser.hasClass("timePeriodChooser")) {
          console.log("Component is already initialized.");
          return;
        }

        var saveState = function() {
          if (_options.stateful) {
            var state={};
            state.periodType = periodType.val();
            state.startDate = rangeStart.datepicker("getDate");
            state.endDate = rangeEnd.datepicker("getDate");
            var stateStr = JSON.stringify(state);
            localStorage.setItem(_options.stateId, stateStr);
          }
        };

        var readState = function() {
          var state = {};
          if (_options.stateful) {
            var stateStr = localStorage.getItem(_options.stateId);
            state = JSON.parse(stateStr);
          }
          return state;
        };

        _options = $.extend(_options, readState());

        rangeStart.on('change.ccap.rangeStart', function() {
          saveState();
        });

        rangeEnd.on('change.ccap.rangeEnd', function() {
          saveState();
        });

        if (rangeStart.length != 1 || rangeEnd.length != 1) {
          alert("Must contian $('.rangeChooser_start input') and $('.rangeChooser_end input').");
          return;
        }

        [rangeStart, rangeEnd].map(function(dateField) {
          dateField.datepicker({dateFormat: "mm-dd-yy"});
        });

        var startDt =
          (typeof _options.startDate != 'undefined')?
            (new Date(_options.startDate)):
            (rangeStart.datepicker("getDate"));

        var endDt =
          (typeof _options.endDate != 'undefined')?
            (new Date(_options.endDate)):
            (rangeEnd.datepicker("getDate"));

        var pType =
          (typeof _options.periodType != 'undefined')?
            (_options.periodType):
            (periodType.val());

        var container = $('<span class="rangeChooser_container"></span>');

        var noneHandler = function(fireChangeEvent) {
          var updateDay = function() {
            periodType.val("");
            rangeStart.datepicker("setDate", null);
            rangeEnd.datepicker("setDate", null);
            rangeStart.change();
            rangeEnd.change();
          };

          $(".startDateLabel", container).hide();
          $(".startContainer", container).hide();
          $(".endContainer", container).hide();
          $(".monthContainer", container).hide();
          $(".quarterContainer", container).hide();
          $(".yearContainer", container).hide();
          $('.date-picker', container).hide();
          if (fireChangeEvent)
            updateDay();
        };

        var dayHandler = function(fireChangeEvent) {
          var updateDay = function(date) {
            $('.startDate', container).datepicker("setDate", date);
            $('.endDate', container).datepicker("setDate", date);
            rangeStart.datepicker("setDate", date);
            rangeEnd.datepicker("setDate", date);
            rangeEnd.change();
          };

          $(".startDateLabel", container).text("Day:");
          $(".startContainer", container).show();
          $(".endContainer", container).hide();
          $(".monthContainer", container).hide();
          $(".quarterContainer", container).hide();
          $(".yearContainer", container).hide();
          $('.date-picker', container).datepicker("option", {
            showOtherMonths: false
          });
          $('.startDate', container).off('change.ccap.rangeChooser');
          $('.startDate', container).on('change.ccap.rangeChooser', function() {
            updateDay($(this).datepicker("getDate"));
          });
          if (fireChangeEvent)
            updateDay(new Date());
        };

        var weekHandler = function(fireChangeEvent) {
          var updateWeek = function(date) {
            $('.startDate', container).datepicker("setDate", date);
            $('.endDate', container).datepicker("setDate", date);
            rangeStart.datepicker("setDate", date);
            date.setDate(date.getDate()+6);
            rangeEnd.datepicker("setDate", date);
            rangeEnd.change();
          };

          $(".startDateLabel", container).text("Week:");
          $(".startContainer", container).show();
          $(".endContainer", container).hide();
          $(".monthContainer", container).hide();
          $(".quarterContainer", container).hide();
          $(".yearContainer", container).hide();
          $('.date-picker', container).datepicker("option", {
            showOtherMonths: true
          });
          $('.startDate', container).off('change.ccap.rangeChooser');
          $('.startDate', container).on('change.ccap.rangeChooser', function() {
            updateWeek($(this).datepicker("getDate"));
          });
          if (fireChangeEvent)
            updateWeek(new Date());
        };

        var monthHandler = function(fireChangeEvent) {
          var updateMonth = function(year, month) {
            var d = new Date(year, month, 1);
            rangeStart.datepicker("setDate", d);
            // set to next month and roll back to a day
            d.setMonth(d.getMonth()+1);
            d.setDate(d.getDate()-1);
            rangeEnd.datepicker("setDate", d);
            rangeEnd.change();
          };

          $(".startContainer", container).hide();
          $(".endContainer", container).hide();
          $(".monthContainer", container).show();
          $(".quarterContainer", container).hide();
          $(".yearContainer", container).show();
          $('.month, .year', container).off('change.ccap.rangeChooser');
          $('.month, .year', container).on('change.ccap.rangeChooser', function() {
            updateMonth($('.year', container).val(), $('.month', container).val());
          });
          if (fireChangeEvent) {
            var currDate = new Date();
            var currYear = currDate.getFullYear();
            var currMonth = currDate.getMonth();
            $('.year', container).val(currYear);
            $('.month', container).val(currMonth);
            updateMonth(currYear, currMonth);
          }
        };

        var quarterHandler = function(fireChangeEvent) {
          var updateQuarter = function(year, quarterOffset) {
            var d = new Date(year, (0+quarterOffset), 1);
            rangeStart.datepicker("setDate", d);
            // set to end of quarter
            d.setMonth(d.getMonth()+3);
            d.setDate(d.getDate()-1);
            rangeEnd.datepicker("setDate", d);
            rangeEnd.change();
          };

          $(".startContainer", container).hide();
          $(".endContainer", container).hide();
          $(".monthContainer", container).hide();
          $(".quarterContainer", container).show();
          $(".yearContainer", container).show();
          $('.quarter, .year', container).off('change.ccap.rangeChooser');
          $('.quarter, .year', container).on('change.ccap.rangeChooser', function() {
            updateQuarter($('.year', container).val(), $('.quarter', container).val());
          });
          if (fireChangeEvent) {
            var currDate = new Date();
            var currYear = currDate.getFullYear();
            $('.year', container).val(currYear);
            $('.quarter', container).val(0);
            updateQuarter(currYear, 0);
          }
        };

        var yearHandler = function(fireChangeEvent) {
          var onChangeCallback = $.debounce(1000, function() {
            $('.year', container).attr("disabled", "disabled");
            rangeEnd.change();
          });

          var updateYear = function(year) {
            var d = new Date(year, 0, 1);
            rangeStart.datepicker("setDate", d);
            var d = new Date(year, 11, 31);
            rangeEnd.datepicker("setDate", d);
            onChangeCallback();
          };

          $(".startContainer", container).hide();
          $(".endContainer", container).hide();
          $(".monthContainer", container).hide();
          $(".quarterContainer", container).hide();
          $(".yearContainer", container).show();
          $('.year', container).off('change.ccap.rangeChooser');
          $('.year', container).on('change.ccap.rangeChooser', function() {
            updateYear($('.year', container).val());
          });
          if (fireChangeEvent) {
            var year = new Date().getFullYear();
            $('.year', container).val(year);
            updateYear(year);
          }
        };

        var rangeHandler = function(fireChangeEvent) {
          $(".startDateLabel", container).text("Start Date:");
          $(".startContainer", container).show();
          $(".endContainer", container).show();
          $(".monthContainer", container).hide();
          $(".quarterContainer", container).hide();
          $(".yearContainer", container).hide();
          $('.date-picker', container).datepicker("option", {
            showOtherMonths: false
          });

          var validateDateRange = function(startDate, endDate) {
            var mStart = moment(startDate);
            var mEnd = moment(endDate);
            var maxRange = _options.maximumDateRange;
            var valid = true;

            $("div.errors", rangeChooser).remove();

            if (mStart.diff(mEnd, "days") > 0) {
              addError("End Date must be equal to or greater than Start Date.");
              valid = false;
            } else if (typeof maxRange !== 'undefined' && mStart.add(maxRange).diff(mEnd, 'days') < 0) {
              addError("Range must be less than one year");
              valid = false;
            }

            return valid;
          };

          var addError = function(msg) {
            rangeChooser.prepend(
              $('<div class="errors"><div class="error">' + msg + '</div></div>')
            );
          };

          $('.startDate', container).off('change.ccap.rangeChooser');
          $('.startDate', container).on('change.ccap.rangeChooser', function() {
            var dt = $(this).datepicker("getDate");
            rangeStart.datepicker("setDate", dt);

            if (validateDateRange(dt, $('.endDate', container).datepicker("getDate"))) {
              rangeStart.change();
            }
          });
          $('.endDate', container).on('change.ccap.rangeChooser', function() {
            var dt = $(this).datepicker("getDate");
            rangeEnd.datepicker("setDate", dt);

            if (validateDateRange($('.startDate', container).datepicker("getDate"), dt)) {
              rangeEnd.change();
            }
          });

          if (fireChangeEvent) {
            var currentDate = new Date();
            rangeStart.datepicker("setDate", currentDate);
            rangeEnd.datepicker("setDate", currentDate);
            rangeEnd.change();
          }
        };

        function checkSel(typ) {
          if (typ == pType) {
            return 'selected="selected"';
          } else {
            return '';
          }
        };

        var select = $('<select class="periodType crudSelect">' +
          '<option value=""' + checkSel('') + '>Specific Date</option>' +
          '<option value="day"' + checkSel('day') + '>Day</option>' +
          '<option value="week"' + checkSel('week') + '>Week</option>' +
          '<option value="month"' + checkSel('month') + '>Month</option>' +
          '<option value="quarter"' + checkSel('quarter') + '>Quarter</option>' +
          '<option value="year"' + checkSel('year') + '>Year</option>' +
          '<option value="range"' + checkSel('range') + '>Range</option>' +
          '</select>')
          .change(function(e) {
            var selected = $(this).find('option:selected').val();
            pType = selected;

            periodType.val(pType);

            switch (pType) {
              case 'day':
                dayHandler(true);
                break;
              case 'week':
                weekHandler(true);
                break;
              case 'month':
                monthHandler(true);
                break;
              case 'quarter':
                quarterHandler(true);
                break;
              case 'year':
                yearHandler(true);
                break;
              case "range":
                rangeHandler(true);
                break;
              default:
                noneHandler(true);
            }
          });

        var uniqueId = "ccap_" + new Date().getTime();

        var id = uniqueId + "_startDate";
        var startDate = $('<span class="startContainer">' +
          '<label class="startDateLabel" for="' + id + '">Start Date:</label>' +
          '<input id="' + id + '" class="startDate rangeChooser_date-picker" />' +
          '</span>').hide();

        id = uniqueId + "_endDate";
        var endDate = $('<span class="endContainer">' +
          '<label class="endDateLabel" for="' + id + '">End Date:</label>' +
          '<input id="' + id + '" class="endDate rangeChooser_date-picker" />' +
          '</span>').hide();

        id = uniqueId + "_month";
        var month = $('<span class="monthContainer">' +
          '<label for="' + id + '">Month:</label>' +
          '<select class="month crudSelect" id="' + id + '">' +
          '<option value="0">January</option>' +
          '<option value="1">February</option>' +
          '<option value="2">March</option>' +
          '<option value="3">April</option>' +
          '<option value="4">May</option>' +
          '<option value="5">June</option>' +
          '<option value="6">July</option>' +
          '<option value="7">August</option>' +
          '<option value="8">September</option>' +
          '<option value="9">October</option>' +
          '<option value="10">November</option>' +
          '<option value="11">December</option>' +
          '</select>' +
          '</span>');

        id = uniqueId + "_quarter";
        var quarter = $('<span class="quarterContainer">' +
          '<label for="' + id + '">Quarter:</label>' +
          '<select class="quarter crudSelect" id="' + id + '">' +
          '<option value="0">First</option>' +
          '<option value="3">Second</option>' +
          '<option value="6">Third</option>' +
          '<option value="9">Fourth</option>' +
          '</select>' +
          '</span>');

        id = uniqueId + "_month";
        var year = $('<span class="yearContainer">' +
          '<label for="' + id + '">Year:</label>' +
          '<input id="' + id + '" class="year" type="number" />' +
          '</span>');

        container
          .append(select)
          .append(startDate)
          .append(endDate)
          .append(month)
          .append(quarter)
          .append(year);
        rangeChooser.append(container);

        $('.rangeChooser_date-picker', container).datepicker({
          dateFormat: "mm-dd-yy",
          showOn: "button",
          buttonImage: app.contextPath + "/classpath/common/images/calendar-blue.png",
          changeMonth: true,
          changeYear: true,
          buttonImageOnly: true
        });

        periodType.val(pType);

        if (startDt) {
          $('.startDate', container).datepicker("setDate", startDt);
          rangeStart.datepicker("setDate", startDt);
          $('.month', container)[0].selectedIndex = startDt.getMonth();
          $('.quarter', container).find("option[value='"+startDt.getMonth()+"']").attr("selected", "selected");
        }

        if (endDt) {
          $('.endDate', container).datepicker("setDate", endDt);
          rangeEnd.datepicker("setDate", endDt);
          $('.year', container).val(endDt.getFullYear());
        }

        switch (pType) {
          case 'day':
            dayHandler(false);
            break;
          case 'week':
            weekHandler(false);
            break;
          case 'month':
            monthHandler(false);
            break;
          case 'quarter':
            quarterHandler(false);
            break;
          case 'year':
            yearHandler(false);
            break;
          case "range":
            rangeHandler(false);
            break;
          default:
            noneHandler(false);
        }

        $('.crudSelect').width(120);

        if (!_options.allowNoneTimePeriod) {
          $('.periodType').children().first().hide();
        }

        // signifies component already initialized
        rangeChooser.addClass("timePeriodChooser");
      }

    };

    $.fn.timePeriodChooser = function(method) {
      if(methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call( arguments, 1 ));
      }
      else if ( typeof method === 'object' || ! method ) {
        return methods.init.apply( this, arguments );
      }
      else {
        $.error( 'Method ' +  method + ' does not exist on jquery.ccap.rangeChooser' );
      }
    };

})(jQuery);
