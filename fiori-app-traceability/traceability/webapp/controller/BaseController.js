/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, UIComponent, History, MessageBox, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("com.9b.traceability.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		cellClick: function (evt) {
			//	evt.getParameter("cellControl").getParent()._setSelected(true);
			var cellControl = evt.getParameter("cellControl");
			var isBinded = cellControl.getBindingContext("jsonModel");
			if (isBinded) {
				var oTable = evt.getParameter("cellControl").getParent().getParent();
				var sIndex = cellControl.getParent().getIndex();
				var sIndices = oTable.getSelectedIndices();
				if (sIndices.includes(sIndex)) {
					sIndices.splice(sIndices.indexOf(sIndex), 1);
				} else {
					sIndices.push(sIndex);
				}
				if (sIndices.length > 0) {
					jQuery.unique(sIndices);
					$.each(sIndices, function (i, e) {
						oTable.addSelectionInterval(e, e);
					});
				} else {
					oTable.clearSelection();
				}
			}

			//	oTable.setSelectionInterval(sIndex, sIndex);
		},
		convertUTCDate: function (date) {
			date.setHours(new Date().getHours());
			date.setMinutes(new Date().getMinutes());
			date.setSeconds(new Date().getSeconds());
			var utc = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
			return utc;
		},
		convertUTCDatePost: function (date) {
			date.setHours(new Date().getHours());
			date.setMinutes(new Date().getMinutes());
			date.setSeconds(new Date().getSeconds());
			var utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
			return utc;
		},

		convertUTCDateTime: function (date) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-ddThh:mm:ss",
				UTC: false
			});
			var postingDate = dateFormat.format(new Date(date));
			var finalDate = postingDate + "Z";
			return finalDate;
		},
		convertUTCDateMETRC: function (date) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd",
				UTC: true
			});
			var finalDate = dateFormat.format(new Date(date));
			return finalDate;
		},

		readServiceWithOutLogin: function (entity, callBack) {
			var that = this;
			that.getView().setBusy(false);
			var sessionID = that.getOwnerComponent().getModel("jsonModel").getProperty("/sessionID");
			if (sessionID === undefined) {
				var urlData = this.getOwnerComponent().getModel("pageUrlModel").getData().URLCollection[0];
				var loginPayLoad = {
					"CompanyDB": urlData.CompanyDB,
					"UserName": urlData.UserName,
					"Password": urlData.Password
				};
				loginPayLoad = JSON.stringify(loginPayLoad);
				$.ajax({
					url: urlData.serviceLayerLogin,
					data: loginPayLoad,
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					dataType: "json", // expecting json response
					success: function (data) {
						that.getOwnerComponent().getModel("jsonModel").setProperty("/sessionID", data.SessionId);
						$.ajax({
							type: "GET",
							xhrFields: {
								withCredentials: true
							},
							url: entity,
							setCookies: "B1SESSION=" + sessionID,
							dataType: "json",
							success: function (res) {
								if (that.getView()) {
									that.getView().setBusy(false);
								}
								sap.ui.core.BusyIndicator.hide();
								callBack.call(that, res);
							},
							error: function (error) {
								sap.ui.core.BusyIndicator.hide();
							}
						});
					},
					error: function (error) {
						sap.m.MessageToast.show("Error with authentication");
						if (that.getView()) {
							that.getView().setBusy(false);
						}
					}
				});
			} else {
				$.ajax({
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					url: entity,
					setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					success: function (res) {
						sap.ui.core.BusyIndicator.hide();
						callBack.call(that, res);
					},
					error: function (error) {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			}

		},

		addLeadingZeros: function (num, size) {
			num = num.toString();
			while (num.length < size) num = "0" + num;
			return num;
		},

		errorHandler: function (error) {
			var resText = JSON.parse(error.responseText).error.message.value;
			MessageBox.error(resText);
			that.getView().setBusy(false);
		},
		successHandler: function (text, resText) {
			MessageBox.success(text + resText + " created successfully", {
				closeOnNavigation: false,
				onClose: function () {}
			});
		},

		formatQtyUnit: function (amount, unit) {
			return "Watered " + amount + " " + unit;
		},

		deleteItems: function (table) {
			var that = this;
			//	var table = this.getView().byId("clonePlannerTable");
			if (table.getSelectedIndices().length > 0) {
				$.each(table.getSelectedIndices(), function (i, e) {
					var updateObject = table.getContextByIndex(e).getObject();
					var sUrl = updateObject.__metadata.uri.split("/")[updateObject.__metadata.uri.split('/').length - 1];
					/*	var payLoad = {
							NSTUS: "V",
							NPFBC: updateObject.NPFBC
						};*/
					updateObject.NSTUS = "V";
					updateObject.NVGRD = that.convertDate(new Date());
					that.getOwnerComponent().getModel().remove("/" + sUrl, updateObject, {
						success: function (data) {

						},
						error: function () {

						}
					});
					//	arr.push(plantBarCode);
				});

			}
		},

		callMetricsService: function (entity, methodType, data, success, error) {
			// var obj = this.getView().getModel("jsonModel").getProperty("/selectedMetrics");
			var metricConfig = this.getView().getModel("jsonModel").getProperty("/selectedMetrics");
			if (metricConfig.length === 0) {
				MessageBox.error("Please configure the Metric.");
				return;
			}
			$.ajax({
				data: JSON.stringify(data),
				type: methodType,
				async: false,
				url: metricConfig[0].NURL + entity,
				contentType: "application/json",
				headers: {
					"Authorization": "Basic " + btoa(metricConfig[0].NVNDK + ":" + metricConfig[0].NUSRK)
				},
				success: success.bind(this),
				error: error.bind(this)
			});
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Handler for the Avatar button press event
		 * @public
		 */
		onAvatarPress: function () {
			var sMessage = this.getResourceBundle().getText("avatarButtonMessageToastText");
			sap.m.MessageToast.show(sMessage);
		},

		/**
		 * React to FlexibleColumnLayout resize events
		 * Hides navigation buttons and switches the layout as needed
		 * @param {sap.ui.base.Event} oEvent the change event
		 */
		onStateChange: function (oEvent) {
			var sLayout = oEvent.getParameter("layout"),
				iColumns = oEvent.getParameter("maxColumnsCount");

			if (iColumns === 1) {
				this.getModel("appView").setProperty("/smallScreenMode", true);
			} else {
				this.getModel("appView").setProperty("/smallScreenMode", false);
				// swich back to two column mode when device orientation is changed
				if (sLayout === "OneColumn") {
					this._setLayout("Two");
				}
			}
		},

		/**
		 * Sets the flexible column layout to one, two, or three columns for the different scenarios across the app
		 * @param {string} sColumns the target amount of columns
		 * @private
		 */
		_setLayout: function (sColumns) {
			if (sColumns) {
				this.getModel("appView").setProperty("/layout", sColumns + "Column" + (sColumns === "One" ? "" : "sMidExpanded"));
			}
		},

		/**
		 * Apparently, the middle page stays hidden on phone devices when it is navigated to a second time
		 * @private
		 */
		_unhideMiddlePage: function () {
			// bug in sap.f router, open ticket and remove this method afterwards
			setTimeout(function () {
				this.getView().getParent().getParent().getCurrentMidColumnPage().removeStyleClass("sapMNavItemHidden");
			}.bind(this), 0);
		},

		createMetricsLog: function (data, success, error) {
			this.getOwnerComponent().getModel("MetricLog").create("/MetricLog", data, {
				success: success.bind(this),
				error: error.bind(this)
			});
		},
		createLLLog: function (data, success, error) {
			this.getOwnerComponent().getModel("LLLog").create("/LEAFLINKLOG", data, {
				success: success.bind(this),
				error: error.bind(this)
			});
		},
		createWMLog: function (data, success, error) {
			/*	this.getOwnerComponent().getModel("LLLog").create("/LEAFLINKLOG", data, {
					success: success.bind(this), 
					error: error.bind(this)
				});*/
		},

		/*Methods for multiInput for sarch field for scan functionality start*/
		onSubmitMultiInput: function (oEvent) {
			oEvent.getSource()._bUseDialog = false;
			var value = oEvent.getSource().getValue();
			if (!value) {
				this.fillFilterLoad(oEvent.getSource());
				return;
			}
			value = value.replace(/\^/g, "");
			oEvent.getSource().addToken(new sap.m.Token({
				key: value,
				text: value
			}));
			var orFilter = [];
			var andFilter = [];
			oEvent.getSource().setValue("");
			this.fillFilterLoad(oEvent.getSource());
		},

		tokenUpdateMultiInput: function (oEvent) {
			this.fillFilterLoad(oEvent.getSource(), oEvent.getParameter("removedTokens")[0].getText());
		},

		/*readServiecLayer: function (entity, callBack, busyDialog) {
			var that = this;
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			var sessionID = jsonModel.getProperty("/sessionID");
			if (sessionID === undefined) {
				var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
				loginPayLoad = JSON.stringify(loginPayLoad);
				if (busyDialog) {
					busyDialog.setBusy(true);
				}
				$.ajax({
					url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
					data: loginPayLoad,
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					dataType: "json", // expecting json response
					success: function (data) {
						jsonModel.setProperty("/sessionID", data.SessionId);
						//	var sessionID = that.getOwnerComponent().getModel("jsonModel").getProperty("/sessionID");
						$.ajax({
							type: "GET",
							xhrFields: {
								withCredentials: true
							},
							url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
							setCookies: "B1SESSION=" + data.SessionId,
							dataType: "json",
							success: function (res) {
								if (busyDialog) {
									busyDialog.setBusy(false);
								}
								callBack.call(that, res);
							},
							error: function (error) {
								if (busyDialog) {
									busyDialog.setBusy(false);
								}
								MessageBox.error(error.responseJSON.error.message.value);
							}
						});
					},
					error: function () {
						sap.m.MessageToast.show("Error with authentication");
					}
				});
			} else {
				if (busyDialog) {
					busyDialog.setBusy(true);
				}
				$.ajax({
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
					setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					success: function (res) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						callBack.call(that, res);
					},
					error: function (error) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						MessageBox.error(error.responseJSON.error.message.value);
					}
				});
			}
		}, */
		
		readServiecLayer: function (entity, callBack, busyDialog) {
			var that = this;
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			var sessionID = jsonModel.getProperty("/sessionID");
			if (location.host.indexOf("webide") !== -1) {
				if (sessionID === undefined) {
					var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
					loginPayLoad = JSON.stringify(loginPayLoad);
					if (busyDialog) {
						busyDialog.setBusy(true);
					}
					$.ajax({
						url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
						data: loginPayLoad,
						type: "POST",
						xhrFields: {
							withCredentials: true
						},
						dataType: "json", // expecting json response
						success: function (data) {
							that.getView().setBusy(false);
							jsonModel.setProperty("/sessionID", data.SessionId);
							//	var sessionID = that.getOwnerComponent().getModel("jsonModel").getProperty("/sessionID");
							$.ajax({
								type: "GET",
								xhrFields: {
									withCredentials: true
								},
								url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
								setCookies: "B1SESSION=" + data.SessionId,
								dataType: "json",
								success: function (res) {
									if (busyDialog) {
										busyDialog.setBusy(false);
									}
									sap.ui.core.BusyIndicator.hide();
									callBack.call(that, res);
								},
								error: function (error) {
									if (busyDialog) {
										busyDialog.setBusy(false);
									}
									sap.ui.core.BusyIndicator.hide();
									MessageBox.error(error.responseJSON.error.message.value);
								}
							});
						},
						error: function () {
							that.getView().setBusy(false);
							sap.m.MessageToast.show("Error with authentication");
						}
					});
				} else {
					if (busyDialog) {
						busyDialog.setBusy(true);
					}
					$.ajax({
						type: "GET",
						xhrFields: {
							withCredentials: true
						},
						url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
						//	setCookies: "B1SESSION=" + sessionID,
						dataType: "json",
						success: function (res) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							sap.ui.core.BusyIndicator.hide();
							callBack.call(that, res);
						},
						error: function (error) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							sap.ui.core.BusyIndicator.hide();
							MessageBox.error(error.responseJSON.error.message.value);
						}
					});
				}
			} else {
				if (busyDialog) {
					busyDialog.setBusy(true);
				}
				$.ajax({
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					url: entity,
					//	setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					success: function (res) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						sap.ui.core.BusyIndicator.hide();
						callBack.call(that, res);
					},
					error: function (error) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error(error.responseJSON.error.message.value);
					}
				});
			}
		},
		
		// updateServiecLayer: function (entity, callBack, payLoad, method, busyDialog) {
		// 	var that = this;
		// 	var jsonModel = this.getOwnerComponent().getModel("jsonModel");
		// 	var sessionID = jsonModel.getProperty("/sessionID");
		// 	if (sessionID === undefined) {
		// 		var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
		// 		loginPayLoad = JSON.stringify(loginPayLoad);
		// 		if (busyDialog) {
		// 			busyDialog.setBusy(true);
		// 		}
		// 		$.ajax({
		// 			url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
		// 			data: loginPayLoad,
		// 			type: "POST",
		// 			xhrFields: {
		// 				withCredentials: true
		// 			},
		// 			dataType: "json", // expecting json response
		// 			success: function (data) {
		// 				if (busyDialog) {
		// 					busyDialog.setBusy(false);
		// 				}
		// 				jsonModel.setProperty("/sessionID", data.SessionId);
		// 				payLoad = JSON.stringify(payLoad);
		// 				$.ajax({
		// 					type: method,
		// 					xhrFields: {
		// 						withCredentials: true
		// 					},
		// 					url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
		// 					setCookies: "B1SESSION=" + data.SessionId,
		// 					dataType: "json",
		// 					data: payLoad,
		// 					success: function (res) {
		// 						if (busyDialog) {
		// 							busyDialog.setBusy(false);
		// 						}
		// 						callBack.call(that, res);
		// 					},
		// 					error: function (error) {
		// 						if (busyDialog) {
		// 							busyDialog.setBusy(false);
		// 						}
		// 						MessageBox.error(error.responseJSON.error.message.value);
		// 					}
		// 				});
		// 			},
		// 			error: function () {
		// 				sap.m.MessageToast.show("Error with authentication");
		// 			}
		// 		});
		// 	} else {
		// 		payLoad = JSON.stringify(payLoad);
		// 		if (busyDialog) {
		// 			busyDialog.setBusy(true);
		// 		}
		// 		$.ajax({
		// 			type: method,
		// 			xhrFields: {
		// 				withCredentials: true
		// 			},
		// 			url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
		// 			setCookies: "B1SESSION=" + sessionID,
		// 			dataType: "json",
		// 			data: payLoad,
		// 			success: function (res) {
		// 				if (busyDialog) {
		// 					busyDialog.setBusy(false);
		// 				}
		// 				callBack.call(that, res);
		// 			},
		// 			error: function (error) {
		// 				if (busyDialog) {
		// 					busyDialog.setBusy(false);
		// 				}
		// 				MessageBox.error(error.responseJSON.error.message.value);
		// 			}
		// 		});
		// 	}
		// },
		
		updateServiecLayer: function (entity, callBack, payLoad, method, busyDialog) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			payLoad = JSON.stringify(payLoad);
			if (busyDialog) {
				busyDialog.setBusy(true);
			}
			var sUrl;
			if (location.host.indexOf("webide") !== -1) {
				sUrl = jsonModel.getProperty("/serLayerbaseUrl") + entity;
			} else {
				sUrl =  entity;
			}
			$.ajax({
				type: method,
				xhrFields: {
					withCredentials: true
				},
				url: sUrl,
					//	setCookies: "B1SESSION=" + sessionID,
				dataType: "json",
				data: payLoad,
				success: function (res) {
					if (busyDialog) {
						busyDialog.setBusy(false);
					}
					callBack.call(that, res);
				},
				error: function (error) {
					if (busyDialog) {
						busyDialog.setBusy(false);
					}
					MessageBox.error(error.responseJSON.error.message.value);
				}
			});
		},

		// capture metric log
		createMetricLog: function (sUrl, metricPayload, res) {
			var data = {
				DATETIME: this.convertUTCDate(new Date()),
				USERID: this.getView().getModel("jsonModel").getProperty("/userName"),
				METHOD: "POST",
				URL: sUrl,
				BODY: JSON.stringify(metricPayload),
				RESPONSE: JSON.stringify(res),
				STATUS: "200"
			};
			var that = this;
			this.getOwnerComponent().getModel("MetricLog").create("/MetricLog", data, {
				//	success: success.bind(this),
				//	error: error.bind(this)
			});
		},
		metricSyncFail: function (dialog, error) {
			sap.m.MessageBox.error(JSON.parse(error.responseText).Message);
			dialog.setBusy(false);
			return;
		},
		getMetricsCredentials: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var filters = "?$filter=U_NITTP eq 'METRC'";
			jsonModel.setProperty("/metrcBusy", true);
			jsonModel.setProperty("/enableSyncNow", false);
			this.readServiecLayer("/b1s/v2/NINGT" + filters, function (data) {
				jsonModel.setProperty("/metrcBusy", false);
				if (data.value.length > 0) {
					jsonModel.setProperty("/metrcData", data.value[0]);
				} else {
					jsonModel.setProperty("/metrcData", {});
				}

			});
		},

		/* 
		 * Method used to call function for export to excel for plant table.
		 */
		exportToExcel: function (JSONData, ReportTitle, ShowLabel) {
				//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
				var arrData = typeof JSONData !== 'object' ? JSON.parse(JSONData) : JSONData;
				var CSV = "";
				//Set Report title in first row or line
				// CSV += ReportTitle + '\r\r\n\n';
				//This condition will generate the Label/Header
				if (ShowLabel) {
					var row = "";
					//This loop will extract the label from 1st index of on array
					for (var index in arrData[0]) {
						//Now convert each value to string and comma-seprated
						row += index + ',';
					}
					row = row.slice(0, -1);
					//append Label row with line break
					CSV += row + '\r\n';
				}
				//1st loop is to extract each row
				for (var i = 0; i < arrData.length; i++) {
					var row = "";
					//2nd loop will extract each column and convert it in string comma-seprated
					for (var index in arrData[i]) {
						row += '"' + arrData[i][index] + '",';
					}
					row = row.slice(0, row.length - 1);
					//add a line break after each row
					CSV += row + '\r\n';
				}
				if (CSV === '') {
					console("Invalid data");
					return;
				}
				//Generate a file name
				var fileName = "";
				//this will remove the blank-spaces from the title and replace it with an underscore
				fileName += ReportTitle.replace(/ /g, " ");
				//Initialize file format you want csv or xls
				// var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
				var blob = new Blob([CSV], {
					type: "application/csv;charset=utf-8;"
				});
				var csvUrl = URL.createObjectURL(blob);

				//this trick will generate a temp <a /> tag
				var link = document.createElement("a");
				link.href = csvUrl;
				//set the visibility hidden so it will not effect on your web-layout
				link.style = "visibility:hidden";
				link.download = fileName + ".csv";
				//this part will append the anchor tag and remove it after automatic click
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
			/*Methods for multiInput for sarch field for scan functionality end*/

	});
});