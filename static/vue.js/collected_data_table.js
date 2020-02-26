Vue.use(VeeValidate);
const modal = Vue.component('modal', {
	template: '#modal-template',
});

const detailComponent = Vue.component('collected-data-table', {
	template: '#collected-data-table-template',
});

$(document).ready(() => {
	const table = $('#indicatorsTable').DataTable();
    function format(indicatorId, programId) {
		  let div = $(`<div id="details-${indicatorId}"></div>`);
          $.ajax({
            url: `/indicators/collected_data_table/${indicatorId}/${programId}/`,
            type: 'GET',
            success: function(result) {
               new detailComponent({    
                 delimiters: ['[[', ']]'],
                 data: {
                   collectedData: result,
				   showModal: false,
				   showDeleteModal: false,
				   modalHeader: "Add Result",
				   period: '',
				   date_collected: '',
				   target: '',
				   actual: '',
				   documentation: '',
				   isEdit: '',
				   currentResult: null,
				   itemToDelete: null,
				   targets: []
				 },       
                methods: {
                    makeRequest(method, url, data = null) {
                        axios.defaults.xsrfHeaderName = 'X-CSRFToken';
			            axios.defaults.xsrfCookieName = 'csrftoken';
                        return axios({ method, url, data });
                    },
                    async getTargets(item = null){
                        const res = await this.makeRequest(
                          'GET',
                          `/indicators/get_target/${indicatorId}/`,
						  );
						  
						data = res.data.data
						
						if (this.targets.length === 0) {
							data.forEach(target => {
								if (item) {
									if (target.pk === item.periodic_target) {
										this.targets.push({"id":target.pk, "text":target.period, "target":target.target})
										this.period = target.pk
									}
								} else {
									this.targets.push({"id":target.pk, "text":target.period, "target":target.target})
								}
								
							});
						}
					},

		            toggleResultModal: function(item = null) {
						this.showModal = !this.showModal;
						this.modalHeader = `Add Result`;
						this.targets = []
						this.date_collected = ''
						this.target = ''
						this.actual = ''
						this.period=''
						this.documentation= ''

						if (item) {
							this.isEdit = true;
							this.modalHeader = `Edit Result`;
							this.currentResult = item;
							this.date_collected = item.date_collected
							this.target = item.targeted
							this.actual = item.achieved
							
						}
					},

					toggleDeleteModal: function(data) {
						this.showDeleteModal = !this.showDeleteModal;
						this.modalHeader = 'Confirm delete';
						this.itemToDelete = data;
					},


					setTarget: function(event){
						this.targets.forEach( tag =>{
							if(tag.id === Number(event.target.value)){
								this.target = tag.target
							}
						})
					},


					formatDate: function(date) {
						return moment(date, 'YYYY-MM-DDThh:mm:ssZ').format('YYYY-MM-DD');
					},

					processForm: function(saveNew = false) {
						this.$validator.validateAll().then(result => {
							if (result) {
								if (this.currentResult && this.currentResult.id) {
									this.updateResult();
								} else {
									if (saveNew) {
										this.postData(saveNew);
									} else {
										this.postData();
									}
								}
							}
						});
					},

					async postData(saveNew) {
						console.log(this.documentation)
						try {
							const response = await this.makeRequest(
								'POST',
								`/indicators/collecteddata/add`,
								{
									actual:this.actual,
									target: this.target,
									date_collected:this.date_collected,
									period:this.period,
									indicator:indicatorId,
									documentation:this.documentation,
									program:programId
								}
							);
							if (response) {
								toastr.success('Result successfuly saved');
								this.collectedData.periodictargets.forEach(periodictarget => {
									if (periodictarget.id == response.data.periodic_target) {
										periodictarget.collecteddata_set.push(response.data);		
									}
								})
								if (!saveNew) {
									this.toggleResultModal();
								}
								// resetting the form
				   				this.date_collected= '';
				   				this.target= '';
				   				this.actual= 0;
				   				this.documentation= '';
								this.$validator.reset();
							};
						} catch (error) {
								toastr.error('There was a problem saving your result');
							}
					},

					async updateResult() {
						try {
							const response = await this.makeRequest(
								'PUT',
								`/indicators/collected_data/edit/${this.currentResult.id}`,
								{ 
									actual:this.actual,
									target: this.target,
									date_collected:this.date_collected,
									period:this.period,
									documentation:this.documentation
								 }
							);
							if (response) {
								toastr.success('Result was successfuly updated');
								this.collectedData.periodictargets.forEach(periodictarget => {
									if (periodictarget.id == response.data.periodic_target) {
										periodictarget.collecteddata_set = periodictarget.collecteddata_set.filter(item => +item.id !== +this.currentResult.id )
										periodictarget.collecteddata_set.unshift(response.data);	
									}
								})
								this.isEdit = false;
								this.modalHeader = 'Add Result';
								this.toggleResultModal();
							}
						} catch (e) {
							toastr.error('There was a problem updating your results');
						}
					},

					async deleteResult(itemToDelete) {
						try {
							const response = await this.makeRequest(
								'DELETE',
								`/indicators/collected_data/delete/${itemToDelete.id}`
							);
							if (response.data.success) {
								toastr.success('Result was successfuly Deleted');
								this.collectedData.periodictargets.forEach(periodictarget => {
									if (periodictarget.id == itemToDelete.periodic_target) {
										periodictarget.collecteddata_set = periodictarget.collecteddata_set.filter(item => +item.id !== +itemToDelete.id )		
									}
								})
								this.showDeleteModal = !this.showDeleteModal;
								this.modalHeader = 'Add Result';
							} else {
								this.modalHeader = 'Add Result';
								toastr.error('There was a problem deleting the result');
							}
						} catch (error) {
							toastr.error('There was a server error');
						}
					},


				},
				  
				computed: {
					/**
					 * Check if frequency form is valid
					 */
					isFormValid() {
						return true;
					},
				},
                }).$mount(`#details-${indicatorId}`);
              },
              error: (error) => {
                toastr.error('There was a problem loading the collected data.');
              }
            });
            return div
    }

    $('#indicatorsTable tbody').on('click', 'td.details-control', function () {
        let indicatorId = $(this).data('indicator-id');
        let programId = $(this).data('program-id');
        let tr = $(this).closest('tr');
        let row = table.row(tr);
        if ( row.child.isShown() ) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child(format(indicatorId, programId)).show();
            tr.addClass('shown');
        }
    });
  });