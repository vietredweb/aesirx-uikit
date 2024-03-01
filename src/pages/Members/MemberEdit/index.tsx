/*
 * @copyright   Copyright (C) 2022 AesirX. All rights reserved.
 * @license     GNU General Public License version 3, see LICENSE.
 */

import React, { Component } from 'react';

import { withTranslation } from 'react-i18next';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Col, Form, Row } from 'react-bootstrap';
import { ActionsBar } from 'components/ActionsBar';
import { PublishOptions } from 'components/PublishOptions';
import { ORGANISATION_MEMBER_FIELD } from 'aesirx-lib';
import SimpleReactValidator from 'simple-react-validator';
import _ from 'lodash';
import { withMemberViewModel } from '../MemberViewModel/MemberViewModelContextProvider';
import MemberInformation from './Component/MemberInformation';
import { EditHeader } from 'components/EditHeader';
import { PAGE_STATUS } from 'constant';
import { Input } from 'components/Form/Input';
import { Spinner } from 'components';

const EditMember = observer(
  class EditMember extends Component {
    memberDetailViewModel: any = null;
    validator: SimpleReactValidator;
    formPropsData = { [ORGANISATION_MEMBER_FIELD.CUSTOM_FIELDS]: {} };
    isEdit = false;
    constructor(props: any) {
      super(props);
      this.state = {};
      this.validator = new SimpleReactValidator({
        autoForceUpdate: this,
        validators: {
          memberName: {
            // name the rule
            message:
              'Member name must be with alphanumeric (a-z, 0-9) characters (plus underscore _) and be between 3 to 20 characters in length',
            rule: (val: any, params?: any, validator?: any) => {
              return (
                validator.helpers.testRegex(val, /^[a-z0-9_]{3,20}$/i) && params.indexOf(val) === -1
              );
            },
          },
        },
      });
      this.memberDetailViewModel = props.model?.memberDetailViewModel
        ? props.model?.memberDetailViewModel
        : null;

      this.memberDetailViewModel.setForm(this);
      this.isEdit = props.match.params?.id ? true : false;
    }

    async componentDidMount() {
      const { match }: any = this.props;
      if (this.isEdit) {
        this.formPropsData[ORGANISATION_MEMBER_FIELD.ID] = match.params?.id;
        await this.memberDetailViewModel.initializeData();
      }
      await this.memberDetailViewModel.getRoleList();
    }

    handleValidateForm() {
      if (this.validator.fields['Member Name'] === true) {
        this.setState((prevState) => {
          return {
            ...prevState,
            requiredField: Math.random(),
          };
        });
      }
      this.validator.showMessages();
    }

    debouncedChangeHandler = _.debounce((value) => {
      this.memberDetailViewModel.handleAliasChange(value);
    }, 300);

    render() {
      const { t, history }: any = this.props;
      // eslint-disable-next-line no-console
      console.log('rerender Member');

      return (
        <div className="py-4 px-3 h-100 d-flex flex-column">
          {this.memberDetailViewModel.formStatus === PAGE_STATUS.LOADING && (
            <Spinner className="spinner-overlay" />
          )}
          <div className="d-flex align-items-center justify-content-between mb-24 flex-wrap">
            <EditHeader
              props={this.props}
              title={t('txt_member')}
              isEdit={this.isEdit}
              redirectUrl={'/pim/members'}
            />
            <div className="position-relative">
              <ActionsBar
                buttons={[
                  {
                    title: t('txt_cancel'),
                    handle: async () => {
                      history.push(`/pim/members`);
                    },
                    icon: '/assets/images/cancel.svg',
                  },
                  {
                    title: t('txt_save_close'),
                    handle: async () => {
                      if (this.validator.allValid()) {
                        const result = this.isEdit
                          ? await this.memberDetailViewModel.update()
                          : await this.memberDetailViewModel.create();
                        if (!result?.error) {
                          history.push(`/pim/members`);
                        }
                      } else {
                        this.handleValidateForm();
                      }
                    },
                  },
                  {
                    title: t('txt_save'),
                    validator: this.validator,
                    handle: async () => {
                      if (this.validator.allValid()) {
                        if (this.isEdit) {
                          await this.memberDetailViewModel.update();
                          await this.memberDetailViewModel.initializeData();
                          this.forceUpdate();
                        } else {
                          const result = await this.memberDetailViewModel.create();
                          if (!result?.error) {
                            history.push(`/pim/members/edit/${result?.response}`);
                          }
                        }
                      } else {
                        this.handleValidateForm();
                      }
                    },
                    icon: '/assets/images/save.svg',
                    variant: 'success',
                  },
                ]}
              />
            </div>
          </div>
          <Form>
            <Row className="gx-24 mb-24">
              <Col lg={9}>
                <Form.Group className={`mb-24`}>
                  <Input
                    field={{
                      getValueSelected:
                        this.memberDetailViewModel.memberDetailViewModel.formPropsData[
                          ORGANISATION_MEMBER_FIELD.MEMBER_NAME
                        ],
                      classNameInput: 'py-10 fs-4',
                      placeholder: t('txt_add_member_name'),
                      handleChange: (event: any) => {
                        this.memberDetailViewModel.handleFormPropsData(
                          ORGANISATION_MEMBER_FIELD.MEMBER_NAME,
                          event.target.value
                        );
                      },
                      required: true,
                      validation: 'required',
                      blurred: () => {
                        this.validator.showMessageFor('Member Name');
                      },
                    }}
                  />
                  {this.validator.message(
                    'Member Name',
                    this.memberDetailViewModel.memberDetailViewModel.formPropsData[
                      ORGANISATION_MEMBER_FIELD.MEMBER_NAME
                    ],
                    'required|memberName',
                    {
                      className: 'text-danger mt-8px',
                    }
                  )}
                </Form.Group>
                <MemberInformation
                  validator={this.validator}
                  messagesShown={this.validator.messagesShown}
                  isEdit={this.isEdit}
                  formPropsData={this.memberDetailViewModel.memberDetailViewModel.formPropsData}
                  {...this.props}
                />
              </Col>
              <Col lg={3}>
                <PublishOptions
                  detailViewModal={this.memberDetailViewModel}
                  formPropsData={this.memberDetailViewModel.memberDetailViewModel.formPropsData}
                  isEdit={this.isEdit}
                  isFeatured={false}
                  isPublishedSimple={true}
                />
              </Col>
            </Row>
          </Form>
        </div>
      );
    }
  }
);

export default withTranslation()(withRouter(withMemberViewModel(EditMember)));
