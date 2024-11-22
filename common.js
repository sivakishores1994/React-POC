import axios, { AxiosError } from "axios";
import { nextStage } from "../modules/dashboard/fields/stage.utils";
import { getAckMetaData } from "../shared/components/document-upload/document-upload.utils";
import {
  authenticateType,
  FindIndex,
  getTokenChno,
  getUrl,
  keyToken
} from "../utils/common/change.utils";
import { CONSTANTS } from "../utils/common/constants";
import {
  FormConfigModel,
  KeyStringModel,
  KeyWithAnyModel,
  MyinfoNoResponseModel,
  ProductModel,
  StageFieldModel,
} from "../utils/model/common-model";
import { authAction } from "../utils/store/auth-slice";
import { bancaListAction } from "../utils/store/banca-slice";
import { errorAction } from "../utils/store/error-slice";
import { loaderAction } from "../utils/store/loader-slice";
import { lovAction } from "../utils/store/lov-slice";
import { stagesAction } from "../utils/store/stages-slice";
import { store } from "../utils/store/store";
import { urlParamAction } from "../utils/store/urlparam-slice";
import { ValueUpdateAction } from "../utils/store/value-update-slice";
import { exceptionCheck } from "./exception-handling-utils";
import generatePayload from "./payload";
import submitService from "./submit-service";
import { authorizeAction } from "../utils/store/authorize-slice";
import { trustBankAction } from "../utils/store/trust-bank-slice";
import { rateAction } from "../utils/store/rate-slice";
import { StepCountAction } from "../utils/store/step-count-slice";
import { postalCodeAction } from "../utils/store/postal-code";
import { tokenAction } from "../utils/store/token-slice";
import {referralcodeAction} from '../utils/store/referral-code-slice';
import validateService from "./validation-service";
export type AppDispatch = typeof store.dispatch;

/**
 * To get the selected product information from product.json
 * @param products
 * @param productInfoResponse
 * @returns
 */
// const stageSelector = useSelector((state: StoreModel) => state.stages.stages);
//const channelReference1 = stageSelector[0].stageInfo.application.channel_reference;
//const navigate = useNavigate()

export const getProductInfo = (
  products: string,
  productInfoResponse: Array<ProductModel>
) => {
  return async (dispatch: AppDispatch) => {
    let filteredProducts = [];
    let selectedProducts: Array<string>;
    const campaign = getUrl.getParameterByName("campaign") || null;
    const intcid = getUrl.getParameterByName("intcid") || null;
    if(intcid){
      localStorage.setItem("intcid",intcid);
    }
    if (products) {
      selectedProducts =
        products.indexOf(",") > 0 ? products.split(",") : [products];
      for (let i = 0; i < selectedProducts.length; i++) {
        filteredProducts.push(
          // eslint-disable-next-line array-callback-return
          productInfoResponse.filter((product: ProductModel) => {
            if (product.product_type === selectedProducts[i]) {
              if (campaign) {
                product.campaign = campaign;
              }
              return product;
            }
          })
        );
      }
      const flatFilteredArray = filteredProducts.flat();
      localStorage.setItem('products',JSON.stringify(flatFilteredArray));
      if (flatFilteredArray && flatFilteredArray.length > 0) {
        dispatch(urlParamAction.productDetails(flatFilteredArray));
      } else {
        const error = {
          response: {
            status: "error",
            statusText: "no response",
          },
        };
        dispatch(dispatchError(error));
      }
    }
  };
};

/**
 * To get the selected product information from product.json
 */

export const getProductMetaData = (product_type:string | null): any => {
  const url = `${process.env.REACT_APP_PRODUCT_INFO_URL}`;
  return async (dispatch: AppDispatch) => {
    return axios
      .get(url)
      .then(async (response) => {
        let productInfoResponse = response.data.products;
        let products = product_type ? product_type : getUrl.getParameterByName("products");

        if (products) {
          dispatch(getProductInfo(products, productInfoResponse));
          return Promise.resolve();
        } else {
          const error = {
            response: {
              status: "error",
              statusText: "no response",
            },
          };
          dispatch(dispatchError(error));
          return Promise.reject();
        }
      })
      .catch((error: AxiosError) => {
        dispatch(dispatchError(error));
      });
  };
};

/**
 * Make a form-config request based on auth
 * @returns
 */
export const initiateRTOBJourney = (): any => {
  return async (dispatch: AppDispatch) => {
    const flowType = authenticateType()
    console.log("Initial flowtype is", flowType)
    if (flowType === "myinfo") {
      await dispatch(authorize(flowType)).then(async (token: any) => {
       if (sessionStorage.getItem("token")) {
          sessionStorage.removeItem("token");
        }
        localStorage.setItem(
          "chRefNo",
          JSON.stringify(token["channelRefNo"])
        );
        if (!sessionStorage.getItem("token")) {
          dispatch(dispatchAuth(true));
          sessionStorage.setItem(
            "token",
            JSON.stringify(token["channelRefNo"])
          );
          dispatch(dispatchLoader(false));
        } else {
          dispatch(dispatchAuth(false));
        }
      });
    } else {
      return dispatch(formConfig("manual"))
        .then((response: any) => {
          return Promise.resolve(response);
        })
        .catch((error: AxiosError) => {
          dispatch(dispatchError(error));
        });
    }
  };
};

export const getCasaBannerData = (): any => {
  const url = `${process.env.REACT_APP_FUNDING_URL}`;
  return async (dispatch: AppDispatch) => {
    return axios
      .get(url)
      .then((response) => {
        return Promise.resolve(response.data);
      })
      .catch((error: AxiosError) => {
        dispatch(dispatchError(error));
      });
  };
};

export const getBancaEligibleProducts = (data : any): any => {
  let productType = data.stageInfo.products[0].product_type;
  let productCategory = data.stageInfo.products[0].product_category;
  let dateOfBirth = data.stageInfo.applicants['date_of_birth_a_1'];
  let applicantAge = validateService.calculateAge(dateOfBirth);
  let bancaData: any;
  let eligibleBancaInsurances : any = [];
  let eligibleBancaInsuranceInformations : any = [];
  const bancaProductsMappingUrl = `${process.env.REACT_APP_BANCA_PRODUCTS_MAPPING_URL}`;
  return async (dispatch: AppDispatch) => {
      return await fetch(bancaProductsMappingUrl)
        .then((response: any) => {
            return response.json();
        })
        .then(async (productsMappingData: any) => {
                const bancaEligibleProducts = productsMappingData;
                const bancaProductDetailsUrl = `${process.env.REACT_APP_BANCA_PRODUCT_DETAILS_URL}`;
                return await fetch(bancaProductDetailsUrl)
                .then((response: any) => {
                    return response.json();
                })
                .then((productDetailsData: any) => {
                      const bancaProductDetailsInformations = productDetailsData;
                      bancaEligibleProducts.forEach((bancaEligibleProduct: KeyWithAnyModel) => {
                        if(bancaEligibleProduct["ProductCode"] === productType && bancaEligibleProduct["ProductCategory"] === productCategory)
                        {
                          let ageValues = bancaEligibleProduct['InsuranceProductAgeLimit'].split(',');
                          let maxAge = Math.max(...ageValues);
                          let minAge = Math.min(...ageValues);
                          if (applicantAge >= minAge && applicantAge <= maxAge) {
                            eligibleBancaInsurances.push(bancaEligibleProduct["InsuranceProductDetailCode"]);
                            bancaProductDetailsInformations.forEach((bancaProductDetailsInformation: KeyWithAnyModel) => {
                                if(bancaProductDetailsInformation["ProductDetailCode"] === bancaEligibleProduct["InsuranceProductDetailCode"])
                                {
                                  eligibleBancaInsuranceInformations.push(bancaProductDetailsInformation);
                                }
                            });
                            bancaData = {
                              eligible_banca_insurances: eligibleBancaInsurances,
                              eligible_banca_insurance_informations: eligibleBancaInsuranceInformations,
                              banca_product_applicable_a_1: 'Y'
                            } 
                          }
                          else {
                            bancaData = {
                              banca_product_applicable_a_1: 'N'
                            } 
                          }
                        }
                      });
                      dispatch(bancaListAction.getBancaData(bancaData));
                })
        })
  }
};

export const resumeRequest = (appRef : string | null): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const endPoint = appRef + `${process.env.REACT_APP_RTOB_RESUME_END_POINT}`;
  const url = `${
    baseUrl +
    process.env.REACT_APP_RTOB_APPLICATION_END_POINT +
    endPoint
  }`;

  return async (dispatch: AppDispatch) => {
    return dispatch(exceptionCheck(await axios.get(url)))
      .then((response: any) => {
        if(response !== "Rejected"){
        if (response.data && response.data.applicants && response.data.application) {  
          dispatch(urlParamAction.getAuthorize({ channelRefNo: response.data.application.channel_reference }));  
          return Promise.resolve(response.data);
        } else {
          defaultError();
        }
      }
      })
      .catch((err: any) => {
        if(err !== "Rejected"){return Promise.reject(err)}else{dispatch(dispatchLoader(false));}
      });
  };
};

//Upload Request #####
export const uploadRequest = (appRef : string | null): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const endPoint =`${process.env.REACT_APP_RTOB_APPLICATION_END_POINT}`+appRef + `${process.env.REACT_APP_RTOB_UPLOAD_END_POINT}`;
  const url = `${
    baseUrl +
    endPoint
  }`;

  return async (dispatch: AppDispatch) => {
    return dispatch(exceptionCheck(await axios.get(url)))
      .then((response: any) => {
        if(response !== "Rejected"){
        if (response.data && response.data.application) {  
          dispatch(urlParamAction.getAuthorize({ channelRefNo: response.data.application.channel_reference }));  
          return Promise.resolve(response.data);
        } else {
          defaultError();
        }
      }
      })
      .catch((err: any) => {
        if(err !== "Rejected"){return Promise.reject(err)}else{dispatch(dispatchLoader(false));}
      });
  };
};
//End Uplode Request

export const personRequest = (): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const chRefNo: any = sessionStorage.getItem("token") ? sessionStorage.getItem("token") : localStorage.getItem('chRefNo');
  const chToken = JSON.parse(chRefNo);
  const url = `${
    baseUrl +
    process.env.REACT_APP_RTOB_APPLICATION_END_POINT +
    chToken +
    process.env.REACT_APP_RTOB_PERSON_END_POINT
  }`;

  const payload = {
    "tokenKeys": keyToken('authorize-keys'),
    "personKeys": keyToken('myinfo-keys'),
    "code": getTokenChno().code,
    "channelRefNo": getTokenChno().channelRefNo,
    "total_applicants":1,
    "formType":"fff"
  }

  return async (dispatch: AppDispatch) => {
   return dispatch(exceptionCheck(await axios.post(url, payload)))
    .then((response: any) => {
      if (response !== "Rejected") {
        dispatch(urlParamAction.getAuthorize({ channelRefNo: chToken }));
        sessionStorage.removeItem("token");
        localStorage.removeItem('chRefNo');
        if (response.data && response.data.applicants) {
          let myinfoMissingFields: any = [];
          let mandatoryConfig = [
            "block_a_1",
            "street_name_a_1",
            "postal_code_a_1",
            "nationality_a_1",
            "marital_status_a_1",
            "gender_a_1",
            "country_of_birth_a_1",
            "passport_no_a_1"
          ];
          if(response.data.products[0].product_category === 'CC' || response.data.products[0].product_category === 'PL'){
            mandatoryConfig.push("education_level_a_1");
            if (response.data.applicants["education_level_a_1"] === undefined) {
              myinfoMissingFields.push("education_level_a_1");
            }
          }
          let resAddress = false;
          for (let key in response.data.applicants) {
            if (response.data.applicants[key] === null &&
              mandatoryConfig.includes(key)) {
              if (
                key === "block_a_1" ||
                key === "street_name_a_1" ||
                key === "postal_code_a_1"
              ) {
                if(!resAddress) {
                  const resblock = [
                    "block_a_1",
                    "street_name_a_1",
                    "postal_code_a_1",
                  ];
                  myinfoMissingFields.push(...resblock);
                }
                resAddress = true;
              } else {
                myinfoMissingFields.push(key);
              }
            }
          }
          const fieldSwaped = {...response.data};

          if(fieldSwaped.gbFieldMetaData){
            fieldSwaped.fieldmetadata = fieldSwaped.gbFieldMetaData;
            delete fieldSwaped.gbFieldMetaData;
          }
          if(fieldSwaped.fieldMetaData){
            fieldSwaped.fieldmetadata = fieldSwaped.fieldMetaData;
            delete fieldSwaped.fieldMetaData;
          }
         
          if (response.data.applicants) {
            if(response.data.applicants['residency_status_a_1'] === 'FR') {
              myinfoMissingFields.push('passport_no_a_1');
            }
            if(response.data.applicants['alias_a_1']) {
              fieldSwaped.fieldmetadata.data.stages[1].fields.map((res: any) => {
                if (res.logical_field_name === 'other_name_or_alias') {
                  res.default_visibility = 'No';
                } else if(res.logical_field_name === 'alias'){
                  res.component_type = "Text";
                  res.hide_remove_btn = true;
                  res.default_visibility = null;
                }
                return res;
              })
            }
          } 

          if(myinfoMissingFields.length > 0) {
            // dispatch(stagesAction.getMissingFields(myinfoMissingFields));
            let tmpMyInfoMissingFields : any = Object.assign([],myinfoMissingFields);
            dispatch(stagesAction.getMissingFields(tmpMyInfoMissingFields));

            myinfoMissingFields.forEach((field: string) => {
              const result: any = fieldSwaped.fieldmetadata.data.stages;
              fieldSwaped.fieldmetadata.data.stages.forEach(
                (item: any, index: number) => {
                  if (item.stageId === "ssf-1" || item.stageId === "ssf-2") {
                    const fieldIndex = item.fields.findIndex(
                      (ItemIndex: KeyWithAnyModel) =>
                        ItemIndex.logical_field_name === field.split("_a_1")[0]
                    );
                    if (fieldIndex >= 0) {
                      const stageObj = result[index].fields[fieldIndex];
                      if (
                        stageObj.logical_field_name === "block" ||
                        stageObj.logical_field_name === "street_name" ||
                        stageObj.logical_field_name === "postal_code"
                      ) {
                        stageObj.default_visibility = null;
                        stageObj.mandatory = "Yes";

                        fieldSwaped.fieldmetadata.data.stages[1].fields.map(
                          (res: any) => {
                            if (
                              res.logical_field_name === "building_name" ||
                              res.logical_field_name === "unit_no"
                            ) {
                              res.default_visibility = null;
                              const resblock = ["building_name", "unit_no"];
                              myinfoMissingFields.push(...resblock);
                            }
                            return res;
                          }
                        );
                        fieldSwaped.fieldmetadata.data.stages[0].fields.map(
                          (res: any) => {
                            if (
                              res.logical_field_name ===
                                "residential_address" ||
                              res.logical_field_name ===
                                "residential_address_consent"
                            ) {
                              res.default_visibility = "No";
                            }
                            return res;
                          }
                        );
                      }
                    }
                  }
                  fieldSwaped.fieldmetadata.data.stages = result;
                }
              );
            });
          }
          dispatch(
            stagesAction.isPartialMyinfoResponse(
              myinfoMissingFields.length > 0 ? "500" : "200"
            )
          );
          dispatch(lovRequests(fieldSwaped, "ssf-1", myinfoMissingFields));
          dispatch(stagesAction.addMyinfoData(fieldSwaped));
          dispatch(
            stagesAction.getStage({
              id: "ssf-1",
              formConfig: fieldLevelSwipe(fieldSwaped, myinfoMissingFields),
            })
          );
        } else {
          defaultError();
        }
        return Promise.resolve(response);
      }
      })
      .catch((err: AxiosError | string) => {
        if(err !== "Rejected"){return Promise.reject(err);}else{dispatch(dispatchLoader(false));}
      });
  };
};

/**
 * This method is use to get the response from ibanking request
 *@retuns
 */

 export const authorizeRequest = (authType:string,_SSCode: string | number): any => {
  let url: string;
  let endPoint: string;
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  if(authType=== 'ibanking'){
    endPoint = `${process.env.REACT_APP_IBANKING}`;
  }else {
    endPoint = `${process.env.REACT_APP_RTOB_MANUAL_AUTHORIZE}`;
  }
  url = `${
    baseUrl +
    process.env.REACT_APP_RTOB_APPLICATION_END_POINT +
    submitService.generateUUID +
    endPoint
  }`;
  return async (dispatch: AppDispatch) => {
    let payload: any = [];
    if (getUrl.getParameterByName("products")) {
      const product = filterProducDetails();
      payload = {
        products: sortByAscendingOrder(product),
      };
    } else {
      payload = {};
    }
    dispatch(urlParamAction.productDetails(payload.products));
    if(authType === 'manual'){
    dispatch(setReferralCode())
    }
    if(getUrl.getAggregatorStatus()){
      payload.application = await setAggregator()
      dispatch(urlParamAction.aggregatorsDetails(payload.application));
    }
    return dispatch(exceptionCheck(await axios.post(url, payload)))
      .then((response: any) => {
        dispatch(
          urlParamAction.getAuthorize({
            channelRefNo: response.data.application.channel_reference,
          })
        );
        if (!getUrl.getParameterByName("products") && authType === 'ibanking') {
          return dispatch(getProductMetaData(response.data.products[0].product_type))
            .then(async () => {
              let productDetails = filterProducDetails();
              const ibankResponse = response.data;
              dispatch(urlParamAction.productDetails(productDetails));
              ibankResponse.isIbanking = true;
              dispatch(
                stagesAction.getStage({
                  id: "ssf-1",
                  formConfig: ibankResponse,
                })
              );
              dispatch(lovRequests(ibankResponse, "ssf-1"));
              dispatch(stagesAction.addIbankingData(ibankResponse));
              return Promise.resolve(ibankResponse);
            })
            .catch((error: AxiosError) => {
              dispatch(dispatchError(error));
            });
        } else {
          const authResponse = response.data;
          if(authType === 'ibanking'){
            authResponse.isIbanking = true;
            dispatch(
              urlParamAction.getAuthorize({
                channelRefNo: authResponse.application.channel_reference,
              })
            );
          }
          if(authType === 'manual'){
            const stageBDId = response.data.fieldmetadata.data.stages.findIndex((id:any)=>id.stageId === 'bd-1');
            const fieldIndex = response.data.fieldmetadata.data.stages[stageBDId].fields.findIndex((id:any)=>id.logical_field_name === 'date_of_birth');
            response.data.fieldmetadata.data.stages[stageBDId].fields[fieldIndex]['field_set_name'] = 'Basic Information';
            dispatch(urlParamAction.productDetails(payload.products));
            authResponse.products = payload.products;
            authResponse.applicants = {};
            authResponse.fieldmetadata =  response.data.fieldmetadata;
          }
          dispatch(
            stagesAction.getStage({
              id: "ssf-1",
              formConfig: authResponse,
            })
          );
          dispatch(lovRequests(authResponse, "ssf-1"));
          if(authType === 'ibanking'){
          dispatch(stagesAction.addIbankingData(authResponse));
          }
          return Promise.resolve(authResponse);
        }
      })
      .catch((err: AxiosError | any) => {
        if (err !== "Rejected") {
          dispatch(dispatchError(err));
        }
      });
  };
};

/**
 * The method is used to get session ID and setting session id to form-config header to get ssf fields
 * @returns
 */
export const getClientInfo = (): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const endpoint = `${process.env.REACT_APP_RTOB_LOGIN_END_POINT}`;
  const isMyInfoVirtual = getUrl.getParameterByName("isMyInfoVirtual");
  const SSCode = getUrl.getParameterByName("SSCode") || getUrl.getParameterByName('transfer-token'); //ibanking token
  const authType = getUrl.getParameterByName("auth"); //auth type
  const options = {
    method: "GET",
    url: baseUrl + endpoint,
    headers: {
      Authorization: `${process.env.REACT_APP_RTOB_AUTHORIZATION}`,
    },
  };

  return async (dispatch: AppDispatch) => {
    dispatch(dispatchLoader(true));
    return axios
      .request(options)
      .then(async (clientResponse) => {
        dispatch(
          authAction.getSession({
            sessionuid: clientResponse.headers["sessionuid"],
            SSCode: SSCode ? SSCode : null,
          })
        );       
        if (getUrl.getChannelRefNo().tmxSessionId === null) {
          const tmxSessionId = submitService.generateUUID;
          const url = process.env.REACT_APP_TMX_URL;
          const script = document.createElement("script");
          script.src = `${url}&session_id=${tmxSessionId}&page_id=ssf`;
          script.id = "tmxScript";
          document.head.appendChild(script);
          dispatch(
            urlParamAction.applicationDetails({
              tmxSessionId: tmxSessionId
            })
          );          
        }        
        if (!isMyInfoVirtual && !SSCode && authType !== "manual" && authType !== "resume") {
          return dispatch(getProductMetaData(null))
            .then(async () => {
              return dispatch(initiateRTOBJourney())
                .then(async (response: any) => {
                  return Promise.resolve(response);
                })
                .catch((error: AxiosError) => {
                  dispatch(dispatchError(error));
                });
            })
            .catch((error: AxiosError) => {
              dispatch(dispatchError(error));
            });
        } else if (isMyInfoVirtual && !SSCode && authType !== "manual" && authType !== "resume") {
          return dispatch(getToken())
            .then(async () => {
              return dispatch(personRequest())
                .then(async (response: any) => {
                  return Promise.resolve(response);
                })
                .catch((error: any) => {
                  if (error !== "Rejected") {
                    dispatch(dispatchError(error));
                  }
                });
            })
            .catch((error: any) => {
              if (error !== "Rejected") {
                dispatch(dispatchError(error));
              }
            });
        } else if (SSCode && authType !== "manual" && authType !== "resume") {
            if (!getUrl.getParameterByName("products")) {
              return dispatch(authorizeRequest("ibanking", SSCode))
              .then(async (response: any) => {
               return Promise.resolve(response);
              })
              .catch((error: AxiosError) => {
                dispatch(dispatchError(error));
              });
          } else {
            return dispatch(getProductMetaData(null))
              .then(async () => {
                return dispatch(authorizeRequest("ibanking", SSCode))
                  .then(async (response: any) => {
                    return Promise.resolve(response);
                  })
                  .catch((error: AxiosError) => {
                    dispatch(dispatchError(error));
                  });
              })
              .catch((error: AxiosError) => {
                dispatch(dispatchError(error));
              });
          }
        } else if (authType === "manual") {
          return dispatch(getProductMetaData(null))
            .then(async () => {
              return dispatch(authorizeRequest("manual", ""))
                .then(async (response: any) => {
                  return Promise.resolve(response);
                })
                .catch((error: AxiosError) => {
                  dispatch(dispatchError(error));
                });
            })
            .catch((error: AxiosError) => {
              dispatch(dispatchError(error));
            });
        } else if (authType === "resume") {
         /* return dispatch(authorizeRequest("resume", ""))
          .then(async (response: any) => {
            return Promise.resolve(response);
          })
          .catch((error: AxiosError) => {
            dispatch(dispatchError(error));
          });*/
          return Promise.resolve(clientResponse);
        }
      })
      .catch((error: AxiosError) => {
        dispatch(dispatchError(error));
      });
  };
};

/**
 * The method used to show error popup model based on API failure status
 * @param error fetching response status code
 * @returns
 */
export const dispatchError = (error: AxiosError | MyinfoNoResponseModel): any => {
  return (dispatch: AppDispatch) => {
    dispatch(dispatchLoader(false));
    if (error && error.response) {
      dispatch(
        errorAction.getError({
          statusCode: error.response.status,
          statusText: error.response.statusText,
        })
      );
    } else {
      dispatch(
        errorAction.getError({
          statusCode: "error",
          statusText: "no response",
        })
      );
    }
  };
};

/**
 * Used to show loader indicator while making API request.
 * @param loader sending Boolean flag to show/hide loader
 * @returns
 */
export const dispatchLoader = (loader: boolean): any => {
  return (dispatch: AppDispatch) => {
    dispatch(
      loaderAction.getState({
        isFetching: loader,
      })
    );
  };
};

export const dispatchCtaLoader = (loader: boolean): any => {
  return (dispatch: AppDispatch) => {
    dispatch(
      loaderAction.updateCta({
        cta: loader,
      })
    );
  };
};

/**
 * The method used to proceed myinfo flow.
 * @param auth sending Boolean flag to show/hide
 * @returns
 */
export const dispatchAuth = (auth: boolean): any => {
  return (dispatch: AppDispatch) => {
    dispatch(urlParamAction.isMyinfo(auth));
  };
};

/**
 * LOV API request
 * @param field Based on logical field initiating LOV API request
 * @returns
 */
export const getLovData = (field: string, searchKey?: string): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const lovRef = process.env.REACT_APP_RTOB_LOVREF;
  const formType = process.env.REACT_APP_RTOB_FORMTYPE;
  const endpoint = searchKey
    ? `${lovRef + field + formType}&size=25&q=${searchKey}`
    : `${lovRef + field + formType}`;

  const url = baseUrl + endpoint;

  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.get(url);
      dispatch(
        lovAction.getLovData({
          label: field,
          value: res.data,
        })
      );
      return await Promise.resolve(res);
    } catch (err: any) {
      dispatch(dispatchError(err));
      return Promise.reject(err.response);
    }
  };
};

/**
 * The method used to get dedupe call and form-config request
 * @param channelRef setting channel reference number
 * @param payload attaching payload based on current stage user inputs
 * @returns
 */
export const preserveRequest = (
  data: any,
  currentStageFields: any,
  isExit?: boolean
): any => {
  return async (dispatch: AppDispatch) => {
    const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
    const saveEndPoint = `${process.env.REACT_APP_RTOB_SAVE_END_POINT}`;
    const application = `${process.env.REACT_APP_RTOB_APPLICATION_END_POINT}`;
    const channelRefNo = getUrl.getChannelRefNo().channelRefNo;
    const saveUrl = `${application + channelRefNo + saveEndPoint}`;
    let url = baseUrl + saveUrl;

    let payload = generatePayload.createPayload(
      data,
      currentStageFields,
      url,
      isExit
    );

     return await dispatch(exceptionCheck(await axios.post(url, payload), isExit)).then((response: any) => {
        return Promise.resolve(response);
      }
    );
  };
};

/**
 * The method used to get dedupe call and form-config request
 * @param channelRef setting channel reference number
 * @param payload attaching payload based on current stage user inputs
 * @returns
 */
export const postRequest = (
  data: any,
  currentStageFields: any,
  currentStageId: string,
  applicationJourney: string | null
): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const createEndPoint = `${process.env.REACT_APP_RTOB_CREATE_END_POINT}`;
  const basicEndPoint = `${process.env.REACT_APP_RTOB_BASIC_END_POINT}`;
  const saveEndPoint = `${process.env.REACT_APP_RTOB_SAVE_END_POINT}`;
  const applyEndPoint = `${process.env.REACT_APP_RTOB_APPLY_END_POINT}`;
  const confirmEndPoint = `${process.env.REACT_APP_RTOB_CONFIRM_END_POINT}`;
  const fulFilmentEndPoint = `${process.env.REACT_APP_RTOB_FULFILMENT_DATA}`;
  const application = `${process.env.REACT_APP_RTOB_APPLICATION_END_POINT}`;
  const offerEndPoint = `${process.env.REACT_APP_RTOB_OFFER_END_POINT}`;
  const channelRefNo = getUrl.getChannelRefNo().channelRefNo;
  const applicationRefNo = getUrl.getChannelRefNo().applicationRefNo;
  const saveUrl = `${application + channelRefNo + saveEndPoint}`;
  const createUrl = `${application + channelRefNo + createEndPoint}`;
  const basicDataUrl = `${application + channelRefNo + basicEndPoint}`;
  const applyUrl = `${application + channelRefNo + applyEndPoint}`;
  const confirmUrl = `${application + channelRefNo + confirmEndPoint}`;
  const fulFilment = `${application + channelRefNo + fulFilmentEndPoint}`;
  const offerUrl = `${application + channelRefNo + offerEndPoint}`;
  const stage = getUrl.getStageInfo();
  const productCategory = getProductCategory(stage[0].stageInfo.products);
  let url = baseUrl + saveUrl;
  if (currentStageId === "ssf-1" || (currentStageId === "ssf-2" && !applicationRefNo)) {
    url = baseUrl + createUrl;
  } else if (currentStageId === "bd-3") {
    if(data.stageInfo.applicants['credit_limit_consent_a_1'] === 'N'){
      if(productCategory === 'PL'){
      url = baseUrl + saveUrl;
    }
    else{
      url = baseUrl + applyUrl;
    }
  }
    else{
      url = baseUrl + basicDataUrl;
    }
  } else if (currentStageId === "ad-2") {
    url = baseUrl + applyUrl;
  } else if (currentStageId === "ACD") {
    url = baseUrl + offerUrl;
  } else if (currentStageId === "rp") {
    url = baseUrl + confirmUrl;
  }

  let payload = generatePayload.createPayload(data, currentStageFields, url);

  /**
   * Ibanking create
   * @param products Setting products in create for ibanking
   * @returns
   */
  if(data.stageInfo.applicants['auth_mode_a_1'] === 'IX' && url.split("/").indexOf("create") !== -1){
    payload.products = getUrl.getProductDetails()
 }

  return async (dispatch: AppDispatch) => {
    const lottieEndpoint = url.split('/');
    dispatch(urlParamAction.getUrlEndPoit(lottieEndpoint[lottieEndpoint.length-1]));
    if(lottieEndpoint[lottieEndpoint.length-1] === 'preserve' || lottieEndpoint[lottieEndpoint.length-1] === 'acknowledge') {
      dispatch(dispatchCtaLoader(true));
    } else {
      dispatch(dispatchCtaLoader(false));
      dispatch(dispatchLoader(true));
    }
    if(lottieEndpoint[lottieEndpoint.length-1] === 'apply') {
      dispatch(ValueUpdateAction.isPegaRequest(false));
    } else if(lottieEndpoint[lottieEndpoint.length-1] !== 'apply' && getUrl.getChangeUpdate() === false) {
      dispatch(ValueUpdateAction.isPegaRequest(true));
    }
    try {
      let res: any;
      await dispatch(exceptionCheck(await axios.post(url, payload))).then(
        (response: any) => {
          res = response;
          if (response !== "Rejected") {
            dispatch(urlParamAction.getUrlEndPoit('success'));
            dispatch(dispatchCtaLoader(false));
            if (res) {
              if (res.data) {
                const cli_limit = data.stageInfo.applicants.credit_limit_consent_a_1;
                const lastUpdatedState = getUrl.getSteps().credit_limit_option;
                if(cli_limit && lastUpdatedState && (cli_limit !== lastUpdatedState)) {
                  dispatch(StepCountAction.modifyTotalCount({"label": "credit_limit_consent-"+ data.stageInfo.applicants.credit_limit_consent_a_1, "productCategory":productCategory}));
                }
                if(!applicationJourney) {
                  const last_updated_credit_limit_date_flag = res.data.applicant['last_updated_credit_limit_date_flag'];
                  if(last_updated_credit_limit_date_flag) {
                    dispatch(StepCountAction.modifyTotalCount({"label":last_updated_credit_limit_date_flag, "productCategory":productCategory}));
                  }
                  dispatch(stagesAction.deleteStageInput())
                  dispatch(stagesAction.getMissingFields(null));
                  dispatch(
                    stagesAction.setJourneyType(res.data.application.journey_type)
                  );
                  applicationJourney = res.data.application.journey_type;
                }
                if ((currentStageId === "ssf-1" || currentStageId === "ssf-2") && res.data.applicant) {
                  //merge myinfo to create response and push to response
                  let reduxDataApplicants = data.stageInfo.applicants
                  let responseDataApplicants = res.data.applicant;
                  Object.keys(responseDataApplicants).forEach((key:any) => {
                    if(reduxDataApplicants[key] === undefined){
                      reduxDataApplicants[key] = responseDataApplicants[key];
                    }
                 });
                 dispatch(
                  stagesAction.getStage({
                    id: "setApplicantList",
                    formConfig: reduxDataApplicants
                  })
                );
                  dispatch(getBancaEligibleProducts(data));
                   const stage = getUrl.getStageInfo();
                  if (getProductCategory(stage[0].stageInfo.products) === 'PL') {
                    if (authenticateType() === "manual") {
                      if (applicationJourney === "ETC") {
                        dispatch(rateRequest('',stage[0].stageInfo.products));
                      } else {
                        dispatch(postalCodeAction.updatePopup(true));
                      }
                    } else {
                      // if(applicationJourney === "ETC"  && authenticateType() === 'ibnk'){
                      //   dispatch(rateRequest('',stage[0].stageInfo.products));
                      // }
                     // else {
                      const getMyInfo = getUrl.getMyInfo();
                      if(getMyInfo.postal_code_a_1){
                        dispatch(rateRequest(getMyInfo.postal_code_a_1,stage[0].stageInfo.products));
                      } 
                    // }
                    }
                  } 
                }
                if (currentStageId === "ad-2" || (currentStageId === "bd-3" && data.stageInfo.applicants['credit_limit_consent_a_1'] === 'N' && getProductCategory(stage[0].stageInfo.products) !== 'PL')) {
                  const productsSelector = data.stageInfo.products;
                  if(!checkProductDetails(productsSelector)){
                    return dispatch(getOfferData(data,dispatch));
                  }
                }
                if (currentStageId === "rp") {
                  if(res.data.products && res.data.products.length >= 1) {
                    dispatch(
                      stagesAction.updateProductDetails(res.data.products[0])
                    );
                  }
                }
              }
              if (!applicationRefNo && res.data) {
                dispatch(
                  urlParamAction.getAuthorize({
                    applicationRefNo:
                      res.data.application.application_reference,
                  })
                );
              }
              /** Document related dispatch */
              /** If document list present then adding it to redux*/
              if (
                ((url.split("/").indexOf("create") !== -1) 
                || currentStageId === "bd-3") &&
                res.data.applicant_documents &&
                res.data.applicant_documents.length > 0
              ) {
                const isDocumentListAvailable = data.stageInfo.applicant_documents;
                if(!isDocumentListAvailable){
                  dispatch(
                    stagesAction.getStage({
                      id: "setDocumentList",
                      formConfig: res.data,
                    })
                  );
                }
              }
              const stageTo = nextStage(currentStageId, applicationJourney);
              dispatch(stagesAction.updateStageId(stageTo));
              if(stageTo !== "doc" && stageTo !== "rp"){dispatch(lovRequests(data.stageInfo, stageTo))}
            }
          }
        }
      );
      return Promise.resolve(applicationJourney);
    } catch (error: any) {
      if (error !== "Rejected") {
        dispatch(dispatchError(error));
      }
      return Promise.reject(error.response ? error.response : error);
    }
  };
};

/**
 * Initiating form-config request
 * @param payload setting initial payload/stage response based session id
 * @returns
 */
export const formConfig = (_auth: string, createResponse?: any): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const endPoint = process.env.REACT_APP_RTOB_FORMCONFIG;
  const url = `${baseUrl + endPoint}`;
  let payload = generatePayload.formConfigPayload(createResponse);
  return (dispatch: AppDispatch) => {
    dispatch(dispatchLoader(true));
    return axios.post(url, payload).then((formConfigRes) => {
        if (
          formConfigRes.data &&
          formConfigRes.data.status &&
          formConfigRes.data.status["status-code"] === "200"
        ) {
          let isBdStage: string;
          if (
            payload.stage.stage_id === "" &&
            payload.stage.page_id === CONSTANTS.STAGE_NAMES.SSF_1
          ) {
            isBdStage = CONSTANTS.STAGE_NAMES.SSF_1;
          } else if (
            payload.stage.stage_id === "" &&
            payload.stage.page_id === ""
          ) {
            isBdStage = nextStage(
              CONSTANTS.STAGE_NAMES.SSF_1,
              createResponse.application.journey_type
            );
          } else {
            isBdStage = CONSTANTS.STAGE_NAMES.SSF_1;
          }

          if (createResponse) {
            for (let key in createResponse.applicants) {
              if (createResponse.applicants[key]) {
                formConfigRes.data.applicants[key] =
                  createResponse.applicants[key];
              }
            }
          }
          dispatch(
            stagesAction.getStage({
              id: isBdStage,
              formConfig: formConfigRes.data,
            })
          );
          dispatch(lovRequests(formConfigRes.data, isBdStage));

          return Promise.resolve(formConfigRes);
        } else {
          const errorDetails = technicalError(formConfigRes.data.status);
          dispatch(dispatchError(errorDetails));
        }
        dispatch(dispatchLoader(false));
      })
      .catch((err) => {
        dispatch(dispatchError(err));
        return Promise.reject(err.response);
      });
  };
};

/**
 * Initiating Lov data request if myinfo/manual form-config request completed
 */

export const lovRequests = (
  res: any,
  isBdStage: string,
  missingFields?: any
): any => {
  return (dispatch: AppDispatch) => {
    if (res && isBdStage !== 'doc') {
      const requestAll = async () => {
        let currentStage;
        if(isBdStage === "ssf-1" && authenticateType() !== "myinfo" && authenticateType() !== "manual"){
          currentStage= [isBdStage, CONSTANTS.STAGE_NAMES.SSF_2]
        }
        else if(isBdStage === "ad-2" && authenticateType()== "manual"){
          currentStage= ['ad'];
        }
        else if(isBdStage === "ad-2" && authenticateType()== "myinfo"){
          currentStage= ['ad'];
        }
        else if(isBdStage === "ssf-1" || isBdStage === "bd-2" || isBdStage === "bd-3" && authenticateType()== "manual"|| authenticateType()== "myinfo"){
          currentStage= ['bd'];
        }
        else{
          currentStage= [isBdStage];
        }
        // let currentStage =
        // isBdStage === "ssf-1" && authenticateType() !== "myinfo" && authenticateType() !== "manual"
        // ? [isBdStage, CONSTANTS.STAGE_NAMES.SSF_2]
        //     : [isBdStage];
        // Passing an array of promises that are already resolved to trigger Promise.all as soon as possible
        let resolvedLov: any = [];
        currentStage.forEach(async (stage: string) => {
          const index = FindIndex(res, stage);
          // const index = FindIndex(res, stage);
          if(res.fieldmetadata.data.stages[index] && res.fieldmetadata.data.stages[index].fields) {
            res.fieldmetadata.data.stages[index].fields.map(
              async (lov: KeyWithAnyModel) => {
                try {
                  if (
                    lov.lov === "Yes" &&
                    ((!(
                      missingFields &&
                      missingFields.includes(lov.logical_field_name)
                    ) &&
                    isBdStage !== "ssf-2") || isBdStage !== "ssf-1" || missingFields === null)
                  ) {
                    resolvedLov.push(
                      dispatch(getLovData(lov.logical_field_name))
                    );
                  }
                  else if(lov.lov === "No" && lov.logical_field_name === "mobile_number"){
                      resolvedLov.push(
                        dispatch(getLovData(lov.logical_field_name))
                      );
                  }
                } catch (err) {
                  console.log(err);
                }
              }
            );
          }
        });
        return Promise.all(resolvedLov);
      };
      return requestAll().then(() => {
        dispatch(dispatchLoader(false));
      });
    }
  };
};

/**
 * The method used to swape the missing mandatory fields to other myinfo page.
 * @param formConfigRes retriving from from-config response to swipe the missing logical fields to ssf-2
 * @returns updated
 */
export const fieldLevelSwipe = (
  formConfigRes: FormConfigModel,
  myinfoMissingFields: any
): FormConfigModel => {
  if (myinfoMissingFields && myinfoMissingFields.length > 0) {
    let missingFields: KeyStringModel = {};
    myinfoMissingFields.forEach((field: string) => {
      field = field.split("_a_1")[0];
      const result = formConfigRes.fieldmetadata.data.stages;
      formConfigRes.fieldmetadata.data.stages.forEach(
        (item: StageFieldModel, index: number) => {
          if (item.stageId === "ssf-2") {
            result[index].fields.forEach((response: KeyWithAnyModel) => {
              if (
                response.logical_field_name !== field &&
                response.rwb_category === "ssf-2" &&
                response.field_set_name !== "Missing Myinfo Details"
              ) {
                response.field_set_name = "Pre-filled Myinfo Details";
              }
            });
          }
          if (item.stageId === "ssf-1" || item.stageId === "ssf-2") {
            const fieldIndex = item.fields.findIndex(
              (itemFields: KeyWithAnyModel) =>
                itemFields.logical_field_name === field
            );
            if (fieldIndex >= 0) {
              result[index].fields[fieldIndex].field_set_name =
                "Missing Myinfo Details";
              missingFields[field] = result[index].fields.splice(fieldIndex, 1);
              const ssf_2Index = result.findIndex(
                (resultIndex: StageFieldModel) => resultIndex.stageId === "ssf-2"
              );
              if (Object.keys(missingFields).length > 0) {
                result[ssf_2Index].fields.unshift(missingFields[field][0]);
              }
            }
          }
        }
      );
      formConfigRes.fieldmetadata.data.stages = result;
    });
  }

  // sorting with missing myinfo fields
  formConfigRes.fieldmetadata.data.stages[0].fields.sort(
    (a: KeyWithAnyModel, b: KeyWithAnyModel) => {
      return a.field_set_name.localeCompare(b.field_set_name);
    }
  );
  return formConfigRes;
};

export const technicalError = (data: any) => {
  return  {
    response: {
      status: data["status-code"],
      statusText: "no response",
    }
  };
};

/**
 * Used to identify whether user landed on new screen or changes observed on current screen to make API request.
 * @param data
 * @returns
 */
export const isFormUpdate = (data: boolean | null): any => {
  return (dispatch: AppDispatch) => {
    dispatch(ValueUpdateAction.getValueUpdate(data));
  };
};

export const sortByAscendingOrder = (payload: any) => {
  let sorted_data = payload;
  sorted_data["applicant"] = sortingList(payload["applicant"],'object');
  sorted_data["application"] = sortingList(payload["application"],'object');
  return sorted_data;
};

export const sortingList = (list: any,type:string) => {
  return list && Object.keys(list)
      .sort()
    .reduce((accumulator: any, key: any) => {
          accumulator[key] = list[key];
          return accumulator;
    },type==='array'?[]:{});
};

export const filterProducDetails = () => {
  const product = JSON.parse(JSON.stringify(getUrl.getProductInfo()));
  product.filter((item: any) => {
    delete item.product_description;
    delete item.product_category_name;
    delete item.company_category;
    return item;
  });
  return product;
};

/**
 * The method used to get signon tokens related
 * @returns
 */

export const authorize = (flowType: string): any => {
  let url = '';
  if (flowType === 'myinfo') {
    url = `${process.env.REACT_APP_RTOB_BASE_URL}${process.env.REACT_APP_RTOB_APPLICATION_END_POINT}${submitService.generateUUID}${process.env.REACT_APP_RTOB_MYINFO_AUTHORIZE}`;
    
  } else if (flowType === 'manual') {
    url = `${process.env.REACT_APP_RTOB_BASE_URL}${process.env.REACT_APP_RTOB_APPLICATION_END_POINT}${submitService.generateUUID}${process.env.REACT_APP_RTOB_MANUAL_AUTHORIZE}`;
  }
  const product = filterProducDetails();
  let referParam : string | null | undefined ;
  let referIdParam : string | null | undefined;
      if (getUrl.getParameterByName("refer") === "true") {
        referParam = getUrl.getParameterByName("refer");
      }
      if (getUrl.getParameterByName("referId")) {
        referIdParam = getUrl.getParameterByName("referId");
      }
     
  let application : any = {};

  if(referParam === "true" ){
    application.refer = referParam ;
  }
  if(referIdParam){
    application.referId = referIdParam ;
  }
  let payload: any = [];
  payload = {
    "application":{"total_applicants":1,"form_type":"fff"},
    products: sortByAscendingOrder(product),
    myinfo: {
    	redirectUri: `${process.env.REACT_APP_SINGPASS_CALLBACK}`
    }
  };
  if(application.refer || application.referId){
    payload.application = application ;
  }
  return async (dispatch: AppDispatch) => {
    if(getUrl.getAggregatorStatus()){
      const referapplication = payload.application;
      payload.application = await setAggregator()
      if(referapplication && (referapplication.refer || referapplication.referId)){
        payload.application = {...payload.application,...referapplication}
      }
      dispatch(urlParamAction.aggregatorsDetails(payload.application));
    }
    
    return axios
      .post(url, payload)
      .then((response) => {
        if (response.status === 200) {
          dispatch(authorizeAction.getAuthorize(response.data));
          return Promise.resolve(response.data);
        } else {
          defaultError();
        }
      })
      .catch((error) => {
        dispatch(dispatchError(error));
        return Promise.reject(error);
      });
  };
};

//Method to get the offer response
export const getOfferData = (data: any,dispatch:any) => {
  debugger
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const application = `${process.env.REACT_APP_RTOB_APPLICATION_END_POINT}`;
  const channelRefNo = getUrl.getChannelRefNo().channelRefNo;
  const offerEndPoint = `${process.env.REACT_APP_RTOB_OFFER_END_POINT}`;
  const offerUrl = `${application + data.application.channel_reference + offerEndPoint}`;
  const url = baseUrl + offerUrl;
  let payload = data;

  // return async (dispatch: AppDispatch) => {
    dispatch(trustBankAction.UpdateTrustBank({}));
     return dispatch(exceptionCheck(axios.post(url, payload)))      
      .then((response: any) => {
        if(response !== "Rejected"){
        if (response.status === 200) {
          if (
            response.data.applicant &&
            (response.data.applicant.phoenix_customer_a_1 === "Y" &&
              response.data.applicant.limit_porting_eligible_flag_a_1 === "Y" &&
              (response.data.applicant.customer_consent_for_limit_porting_a_1 === "Y" ||
              response.data.applicant.customer_consent_for_limit_porting_a_1 === "P")
            )
          ) {
            dispatch(trustBankAction.UpdateTrustBank(response.data));
            const stageTo = CONSTANTS.STAGE_NAMES.ACD;
            if (stageTo !== "doc" && stageTo !== "rp") {
              dispatch(lovRequests(data.stageInfo, stageTo));
            }
          } else {
            //gift screen landing to be added
            const stageTo = CONSTANTS.STAGE_NAMES.RP;
            dispatch(stagesAction.updateStageId(stageTo));
          }
          dispatch(dispatchLoader(false));
        } else {
          defaultError();
        }
      }
      })
      .catch((error: any) => {
        if(error !== "Rejected"){
        dispatch(dispatchError(error));
      }
      else{dispatch(dispatchLoader(false));}
      });
  };
// };

export const rateRequest = (postalCode?: string , product? : KeyWithAnyModel): any => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const rate = `${process.env.REACT_APP_RTOB_RATE_END_POINT}`;
  let rateRequestUrl:string ;
  if(getUrl.getJourneyType() === "ETC" && product){  //2243840: RTIM to get Interest rate
    rateRequestUrl = baseUrl + '/applications/'+ getUrl.getChannelRefNo().channelRefNo +`${process.env.REACT_APP_RTOB_RTIM_END_POINT}` + product[0].campaign;
  }else{
    rateRequestUrl = baseUrl + '/applications/' + getUrl.getChannelRefNo().channelRefNo + rate + '?postalCode=' + postalCode
  }
  return async (dispatch: AppDispatch) => {
    if (authenticateType() === "manual" && getUrl.getJourneyType() !== "ETC") {
      return dispatch(exceptionCheck(await axios.get(rateRequestUrl)))
        .then((response: any) => {
          if (response !== "Rejected") {
            if (response.status === 200) {
              dispatch(rateAction.updateAR(response.data.applicant.applied_rate_a_1));
              dispatch(rateAction.updateEIR(response.data.applicant.effective_interest_rate_a_1));
              dispatch(dispatchLoader(false));
            } else {
              defaultError();
            }
          }
        })
        .catch((error: any) => {
          if (error !== "Rejected") {
            dispatch(dispatchError(error));
          }
          else { dispatch(dispatchLoader(false)); }
        });
    } else {
      return await axios.get(rateRequestUrl)
        .then((response: any) => {
          if (response !== "Rejected") {
            if (response.status === 200) {
              if(getUrl.getJourneyType() === "ETC"){
                if(response.data.monthlyFee) {dispatch(rateAction.updateAR(response.data.monthlyFee))}
              }
              else{
                if(response.data.applicant.applied_rate_a_1) {dispatch(rateAction.updateAR(response.data.applicant.applied_rate_a_1))}
                if(response.data.applicant.effective_interest_rate_a_1) { dispatch(rateAction.updateEIR(response.data.applicant.effective_interest_rate_a_1)) }
              }
              dispatch(dispatchLoader(false));
            }
          }
        })
    }
  };
};

export const filterFinalDocList = (
  finalDocumentList:KeyWithAnyModel
) => {
  return finalDocumentList.forEach((list: any) => {
    delete list.tempDocStore;
  });
}

/**
 * The method used to for acknowledge call - document
 * @param tokenId string | null
 * @returns
 */

export const documentSubmit = async (
  applicationReferenceNo: string,
  channelReference: string,
  documentStore: KeyWithAnyModel
) => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  await filterFinalDocList(documentStore.finalDocumentList);
  let documentData :KeyWithAnyModel = {
    applicationRefNo: applicationReferenceNo,
    documents: documentStore.finalDocumentList,
    options: documentStore.optionList.optionsSelected,
  };
  if(getUrl.getParameterByName("auth") === "upload" || store.getState().stages.isDocumentUpload){
    documentData.psdu = "Y"
  }
  const options = {
    method: "POST",
    url:
      baseUrl +
      `/applications/${channelReference}${process.env.REACT_APP_DOCUMENT_ACKNOWLEDGE}`,
    data: documentData,
    headers: {
      "SC-CLIENT-CONTEXT": JSON.stringify(getAckMetaData(channelReference)),
    },
  };
  return axios
    .request(options)
    .then((response) => {
      return Promise.resolve(response);
    })
    .catch((err: AxiosError) => {
      return Promise.reject(err);
    });
};

/**
 * The method used to set hard stop if request fail
 * @returns
 */
export const defaultError = () => {
  return async (dispatch: AppDispatch) => {
    const error = {
      response: {
        status: "error",
        statusText: "no response",
      },
    };
    dispatch(dispatchError(error));
  };
};
/**
 * The method is used to check Product Details for standlone and buddles cards
 */

export const checkProductDetails = (noOfProducts: KeyWithAnyModel):boolean => {
  let hasCC, hasPL, hasCA, hasSA, hasCASA, hasCCPL, hasOnlyCCPL, hasOnlyCASA;
  let CAProduct, SAProduct, CCProduct, PLProduct;
  let CAProductLength: number = 0,
    SAProductLength: number = 0,
    CCProductLength: number = 0,
    PLProductLength: number = 0;
  let returnValue : boolean = false;

  if (noOfProducts && noOfProducts.length && noOfProducts.length === 1) {
    CAProduct = noOfProducts[0].product_category === "CA";
    SAProduct = noOfProducts[0].product_category === "SA";
    CCProduct = noOfProducts[0].product_category === "CC";
    PLProduct = noOfProducts[0].product_category === "PL";
    if (CAProduct || SAProduct) {
      returnValue = true;
    }
    if (CCProduct || PLProduct) {
      returnValue = false;
    }
  }
  if (noOfProducts && noOfProducts.length && noOfProducts.length > 1 ) {
    for (let i = 0; i < noOfProducts.length; i++) {
      if (noOfProducts[i].product_category === "CA") {
        CAProductLength = CAProductLength + 1;
      }
      if (noOfProducts[i].product_category === "SA") {
        SAProductLength = CAProductLength + 1;
      }
      if (noOfProducts[i].product_category === "CC") {
        CCProductLength = CAProductLength + 1;
      }
      if (noOfProducts[i].product_category === "PL") {
        PLProductLength = CAProductLength + 1;
      }
    }
    hasPL = PLProductLength >= 1;
    hasCC = CCProductLength >= 1;
    hasCA = CAProductLength >= 1;
    hasSA = SAProductLength >= 1;
    hasCASA = CAProductLength >= 1 || SAProductLength >= 1;
    hasCCPL = CCProductLength >= 1 || PLProductLength >= 1;
    hasOnlyCCPL =
      (CCProductLength >= 1 || PLProductLength >= 1) &&
      !(CAProductLength >= 1 || SAProductLength >= 1);
    hasOnlyCASA =
      (CAProductLength >= 1 || SAProductLength >= 1) &&
      !(CCProductLength >= 1 || PLProductLength >= 1);
    if (hasCASA || hasSA || hasCA || hasOnlyCASA) returnValue = true;
    if (hasCCPL || hasOnlyCCPL || hasPL || hasCC) returnValue = false;
  }
  return returnValue;
};

/** Ibanking app redirection*/
export const redirectingToIbanking = async () => {
  const tokenLabel = 'SSCode=';
  if (getUrl.getParameterByName("SSCode") || getUrl.getParameterByName('transfer-token') ) {
    const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
    const endpoint = `${process.env.REACT_APP_RTOB_LOGIN_END_POINT}`;
    const channel = getUrl.getParameterByName('channel') ? getUrl.getParameterByName('channel') : null;
    let authToken;
    if(channel === 'IBK') {
      authToken =  getUrl.getChannelRefNo().channelRefNo;
    } else {
      authToken = getUrl.getParameterByName("SSCode") ? getUrl.getParameterByName("SSCode")  : null
    }
    const options = {
      method: "GET",
      url: baseUrl + endpoint,
      headers: {
        Authorization: "ETB " + authToken + "&LOGOUT",
      },
    };
    await axios.request(options).then((response: any) => {
      if (response && response.data) {
        window.location.href =
          `${process.env.REACT_APP_IBANKING_URL}` + tokenLabel + response.data;
      } else {
        window.location.href = `${process.env.REACT_APP_IBANKING_URL}` + tokenLabel;
      }
    });
    } else {
       window.location.href = `${process.env.REACT_APP_IBANKING_URL}` + tokenLabel;
     }
   }
/**
 * The method used to get the product category
 * @param noOfProducts string | null
 * @returns string
 */
export const getProductCategory = (noOfProducts: KeyWithAnyModel) => {

  if (noOfProducts.length === 1)
    return noOfProducts[0].product_category;
  
  let CAProductLength: number = 0,
  SAProductLength: number = 0,
  CCProductLength: number = 0,
  PLProductLength: number = 0;
  for (let i = 0; i < noOfProducts.length; i++) {
    if (noOfProducts[i].product_category === "CA") {
      CAProductLength = CAProductLength + 1;
    } else if (noOfProducts[i].product_category === "SA") {
      SAProductLength = SAProductLength + 1;
    } else if (noOfProducts[i].product_category === "CC") {
      CCProductLength = CCProductLength + 1;
    } else if (noOfProducts[i].product_category === "PL") {
      PLProductLength = PLProductLength + 1;
    }
  }  
  if (CCProductLength >= 1) {
    return "CC";
  }
  if (PLProductLength >= 1) {
    return "PL";
  }
  if (CAProductLength >= 1) {
    return "CA";
  }
  if (SAProductLength >= 1) {
    return "SA";
  }
  return "";     
}
/** Framing aggregator */
export const setAggregator = () : any => {
    const aggregator_code = getUrl.getParameterByName("aggregator_code")
      ? getUrl.getParameterByName("aggregator_code")
      : "";
    const aggregator_type = getUrl.getParameterByName("aggregator_type")
      ? getUrl.getParameterByName("aggregator_type")
      : "";
    const aggregator_instance = getUrl.getParameterByName("aggregator_instance")
      ? getUrl.getParameterByName("aggregator_instance")
      : "";
  
    let aggregator;
    if (aggregator_code || aggregator_type || aggregator_instance) {
      aggregator = {
        ext_source: aggregator_code,
        ext_source_type: aggregator_type,
        ext_source_instance: aggregator_instance,
      };
    }
    return aggregator;
};
export const activateDigitalCard = (applicationDetails:KeyWithAnyModel):any => {
  
  const  payload = generatePayload.getCardActivationPayload(applicationDetails);
  const channelReference = getUrl.getChannelRefNo().channelRefNo;
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const endPoint = process.env.REACT_APP_RTOB_APPLICATION_END_POINT;
  /**onboarding/api/v1/applications/{channel-ref-no}/card/activate */
  const url = `${baseUrl + endPoint + channelReference +"/card/activate"}`;  
  return async (dispatch: AppDispatch) => {
    dispatch(dispatchLoader(true));
    return await axios.post(url, payload)
      .then((response: any) => {
        dispatch(dispatchLoader(false));
        return Promise.resolve(response.data);
      })
      .catch((error: AxiosError) => {
        dispatch(dispatchError(error));
        return Promise.reject(error);
      });
  };
}

/**
 * To fetch key tokens for person call
 * @returns 
 */
export const getToken = (): any => {
  const urls = [`${process.env.REACT_APP_AUTHORIZE_TKN}`, `${process.env.REACT_APP_MYINFO_TKN}`];
  return async (dispatch: AppDispatch) => {
    const requestAll = async () => {
      let tokens: any = [];
      urls.map(async (url: string) => {
        try {
          tokens.push(dispatch(getMyinfoTokens(url)))
        } catch (error) {
          return Promise.reject(error);
        }
      })
      return Promise.all(tokens);
    };
    await requestAll().then(async (res:any) => {
      return Promise.all(res);
    })
  };
};

/**
 * 
 * @param url key json url
 * @returns 
 */
export const getMyinfoTokens = (url: string): any => {
  return async (dispatch: AppDispatch) => {
    try {
      const res:any = await axios.get(url);
        const tokenKey:any = {
          label: url.includes('myinfo-keys') ? 'myinfo-keys': 'authorize-keys',
          value: res.data.keys
        }
        dispatch(
          tokenAction.getToken(tokenKey)
        );
      
      return Promise.resolve(res);
    } catch (err: any) {
      dispatch(dispatchError(err));
      return Promise.reject(err.response);
    }
  }
};
/** Framing refer/referId */
export const setReferralCode = () : any => {
  const refer = getUrl.getParameterByName("refer")
  ? getUrl.getParameterByName("refer")
  : "";
const referId = getUrl.getParameterByName("referId")
  ? getUrl.getParameterByName("referId")
  : getUrl.getParameterByName("aggregator_type")
  ? getUrl.getParameterByName("aggregator_type")
  : "";
  return async (dispatch: AppDispatch) => {
    if(refer){
      dispatch(referralcodeAction.setReferralFlag(refer));
    }
   if(referId){
    dispatch(referralcodeAction.setReferralId(referId));
   }
  }
};

const applicantDocuments:any=[];
export const submitBasicData = async (
  stagePayloadData:any,
  channelReference: any,
  dispatch: AppDispatch
) => {
  dispatch(dispatchLoader(true));
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const rtobproUrl = `${process.env.REACT_APP_BANCA_PRODUCTS_MAPPING_URL}`;
  const rtobdetUrl = `${process.env.REACT_APP_BANCA_PRODUCT_DETAILS_URL}`;
  const options = {
    method: "POST",
    url: 
      baseUrl +
      `/applications/${channelReference}${process.env.REACT_APP_RTOB_BASIC_DATA}`,
    data: {
      ...stagePayloadData,
      applicants: {
        ...stagePayloadData.applicants,
        "client_sequence_no_a_1": 1,
        "fff_journey": "manual"
      }
    },
    headers: {
      "SC-CLIENT-CONTEXT": JSON.stringify(getAckMetaData(channelReference)),
    },
  };
  return await axios
    .request(options)
    .then((response: any) => {
      if(response !== "Rejected"){
        dispatch(dispatchLoader(false));
       fetch(rtobproUrl)
       fetch(rtobdetUrl);
       if(response.data.applicant_documents){
        applicantDocuments.push(response.data.applicant_documents);
       }
       dispatch(formConfig('manual',response.data))
        return Promise.resolve(response.data);
      } else {
        defaultError();
      }
    })
    .catch((err: any) => {
      if(err !== "Rejected"){return Promise.reject(err)};
    });
};

export const submitBasicDataMyInfo = async (
  stagePayloadData:any,
  channelReference: any,
  dispatch: AppDispatch
) => {
  dispatch(dispatchLoader(true));
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const rtobproUrl = `${process.env.REACT_APP_BANCA_PRODUCTS_MAPPING_URL}`;
  const rtobdetUrl = `${process.env.REACT_APP_BANCA_PRODUCT_DETAILS_URL}`;
  const productType = "880"
  const options = {
    method: "POST",
    url: 
      baseUrl +
      `/applications/${getTokenChno().channelRefNo}${process.env.REACT_APP_RTOB_BASIC_DATA}`,
      data: {
      ...stagePayloadData,
      application: {
        ...stagePayloadData.applicants,
        "acquisition_channel": "",
        "application_error_code": [
        ],
        "application_error_message": [
        ],
        "application_reference": "",
        "application_timestamp": "",
        "branch_code": null,
        "channel_reference": getTokenChno().channelRefNo,
        "country_code": "SG",
        "notification_required": false,
        "page_wise": null,
        "priority_flag": "",
        "referral": "",
        "referral_id": "",
        "response_action": "",
        "response_type": "",
        "source_id": "",
        "source_system_name": "3",
        "tmxSessionId": "f9c63c5f-584b-493a-935b-70b329bb9914",
        "total_applicants": 1,
        "tps_creation_timestamp": "",
        "trueClientIP": null,
        "version": ""
      },
      client: {
        // journey: stagePayloadData ? "prelogin_ntc_or_ntp" : null,
        journey: null,
        // "auth-type": stagePayloadData ? authenticateType() : null,
        "auth-type": null,
        // "login-type": stagePayloadData ? "prelogin" : null,
        "login-type": null,
        myinfo: {
          "myinfo-attributes": null,
          "myinfo-code": null,
          "myinfo-redirect-uri": null,
          "myinfo-client-id": null,
          "is-myinfo-virtual": null,
        },
      },
      stage: {
        page_id: "ssf-1",
        stage_id: "BD",
        stage_name: "",
        stage_status: "",
        stage_params: {
          "current_applicant": 1,
          "is_dedupe_required": true
        },
        applicant_status: [],
      },
      dedupeList: {},
      lov_desc: {},
      oz_templates: null,
      preApprovedData: {},
      productsInBundle: [productType],
      applicants: {
        ...stagePayloadData.applicants,
        "client_sequence_no_a_1": 1,
        "fff_journey": "myinfo",
      }
    },
    headers: {
      "SC-CLIENT-CONTEXT": JSON.stringify(getAckMetaData(getTokenChno().channelRefNo)),
    },
  };
  return await axios
    .request(options)
    .then((response: any) => {
      dispatch(dispatchLoader(true));
      if(response !== "Rejected"){
        dispatch(urlParamAction.productDetails(response?.data?.products));
        dispatch(formConfig('manual',response.data))
        fetch(rtobproUrl)
        fetch(rtobdetUrl);
        dispatch(dispatchLoader(false));
        return Promise.resolve(response.data);
      } else {
        defaultError();
      }
    })
    .catch((err: any) => {
      if(err !== "Rejected"){return Promise.reject(err)};
    });
};


export const personalToEmployment = async (
  stagePayloadData:any,
  channelReferenceBasicData:any,
  dispatch:any
) => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const options = {
    method: "POST",
    url:
      baseUrl +
      `/applications/${channelReferenceBasicData}`,
    data: stagePayloadData,
  };
  dispatch(dispatchLoader(true));
  return axios
    .request(options)
    .then((response:any) => {
      // if(response !== "Rejected"){
      dispatch(dispatchLoader(false));
      return Promise.resolve(response);
      // }
    })
    .catch((err: any) => {
      if(err !== "Rejected"){return Promise.reject(err)};
    });
}
export const creditToTrust = async (
  stagePayloadData:any,
  channelReference:any,
  dispatch:any
) => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const options = {
    method: "POST",
    url:
      baseUrl +
      `/applications/${channelReference}${process.env.REACT_APP_RTOB_ADDITIONAL_DATA}`,
    data: stagePayloadData,
  };
  dispatch(dispatchLoader(true));
  return axios
    .request(options)
    .then((response:any) => {
      // if(response !== "Rejected"){
      dispatch(dispatchLoader(false));
      return Promise.resolve(response);
      // }
    })
    .catch((err: any) => {
      if(err !== "Rejected"){return Promise.reject(err)};
    });
}
export const submitBasicDataDocument = async (
  stagePayloadData:any,
  channelReference: any,
  dispatch: AppDispatch
) => {
  dispatch(dispatchLoader(true));
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const options = {
    method: "POST",
    url:
      baseUrl +
      `/applications/${channelReference}${process.env.REACT_APP_RTOB_BASIC_DATA}`,
      data: stagePayloadData,
    headers: {
      "SC-CLIENT-CONTEXT": JSON.stringify(getAckMetaData(channelReference)),
    },
  };
  return await axios
    .request(options)
    .then((response: any) => {
      // if(response !== "Rejected"){
        dispatch(dispatchLoader(false));
        return Promise.resolve(response);
      // }
      //  else {
      //   defaultError();
      // }
    })
    .catch((err: any) => {
      if(err !== "Rejected"){return Promise.reject(err)};
    });
 
};
export const thankYouPage = async (
  stagePayloadData:any,
  channelReference:any,
 dispatch:any,
) => {
  const baseUrl = `${process.env.REACT_APP_RTOB_BASE_URL}`;
  const options2 = {
    method: "POST",
    url:
      baseUrl +
      `/applications/${channelReference}${process.env.REACT_APP_RTOB_FULFILMENT_DATA}`,
    data: stagePayloadData
  };
  dispatch(dispatchLoader(true));
  return axios
    .request(options2)
    .then(response => { 
     dispatch(dispatchLoader(false));
     return Promise.resolve(response.data);
     })
    .catch((err: any) => {
      if(err !== "Rejected"){return Promise.reject(err)};
    });

}
