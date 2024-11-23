import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { KeyWithAnyModel, StoreModel } from "../../../utils/model/common-model";
import "./alias.scss";
import { getFields } from "./alias.utils";
import renderComponent from "../../../modules/dashboard/fields/renderer";
import { constant } from './constant';

export const Alias = (props: KeyWithAnyModel) => {

  const stageSelector = useSelector(
    (state: StoreModel) => state.stages.stages
  );

  const journeyType = useSelector((state: StoreModel) => state.stages.journeyType);

  const aliasSelector = useSelector(
    (state: StoreModel) => state.alias
  );

  const dispatch = useDispatch();
  const [field, setField] = useState([]);
  const addNewAliasName = () => {
    const stageComponents = dispatch(
        getFields(stageSelector, aliasSelector, "add")
    );
    setField(stageComponents);
  };

  useEffect(() => {
    if (stageSelector) {
      const stageComponents = dispatch(
        getFields(stageSelector, aliasSelector, "get")
      );
      setField(stageComponents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aliasSelector]);

    return (
        <>
         {field &&
          field.map((currentSection: KeyWithAnyModel, index: number) => {
            return renderComponent(
              currentSection,
              index,
              props.handleCallback,
              props.handleFieldDispatch,
              props.value
            );
          })}
          { !journeyType && <div className="alias__buttton">
          <div className="alias__plus">
            <input
              type={constant.type}
              name={constant.name}
              aria-label={constant.ariaLabel}
              id={constant.id}
              placeholder={constant.placeholder}
              value={constant.value}
              className ={(aliasSelector && aliasSelector.count < aliasSelector.maxCount) ? 'show-btn, button' : 'hide-btn'}
              onClick={() => addNewAliasName()}
            />
            </div>
          </div>}
        </>
    )
}

export default Alias;
