window.LESSON = {
  "number": 7,
  "title": "动态电路与故障分析",
  "pages": [
    {
      "title": "动态分析先看什么？",
      "question": "滑片移动后，是电源电压先变还是总电阻先变？",
      "steps": [
        "先识别连接与电表测量对象。",
        "判断总电阻变化，再算总电流。",
        "沿串并联规律回推各元件电压、电流，明确电源条件。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "先请学生指出表测哪一段，再动滑片；按接入阻值→总电流→各段电压逐步推理，不重新推导第六章公式。",
      "mode": "series",
      "control": "resistance",
      "meter": true
    },
    {
      "title": "串联滑片变化：两电压怎么变？",
      "question": "电源6 V、R₁＝10 Ω，增大 R₂。",
      "steps": [
        "R总增大，所以 I 减小。",
        "U₁＝IR₁ 减小。",
        "U₂＝U−U₁ 增大；电源总电压保持6 V。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "固定 6 V 电源和 R₁＝10 Ω，先预测滑片使 R₂增大后 I、U₁、U₂怎样变，再拖动验证；两段电压和仍为 6 V。",
      "mode": "series",
      "control": "resistance",
      "meter": true
    },
    {
      "title": "两个电表比值意味着什么？",
      "question": "U₁/I 与 U₂/I 是否都不变？",
      "steps": [
        "U₁/I＝R₁，固定为10 Ω。",
        "U₂/I＝R₂，随滑片位置改变。",
        "不能只说“电压和电流都变，所以比值也变”。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "让学生在两次滑片位置分别算 U₁/I 和 U₂/I；前者对应固定 R₁，后者对应正在变化的 R₂。",
      "mode": "series",
      "control": "resistance",
      "meter": true
    },
    {
      "title": "并联滑片变化：另一支路会变吗？",
      "question": "理想恒压源下增大 R₂，观察三个电流。",
      "steps": [
        "U₁、U₂ 都等于电源电压，保持不变。",
        "I₂＝U/R₂ 减小，I₁ 不变。",
        "干路 I＝I₁＋I₂ 减小。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "理想恒压源下只改变 R₂，请学生先看两支路是否仍跨同一对点；再比 I₁、I₂与干路 I，避免说另一支路也变。",
      "mode": "parallel",
      "control": "resistance",
      "meter": true
    },
    {
      "title": "开关改变连接，怎样重新画图？",
      "question": "断开第二支路后，总电阻怎样变化？",
      "steps": [
        "先移去断开的支路，画有效电路。",
        "并联支路减少，总电阻增大。",
        "理想电源电压不变，干路电流减小。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "断开 S₂后先划去不工作的第二支路，再比较有效电路和干路电流；这是开关变化应用，不重讲第三章的开关定义。",
      "mode": "parallel",
      "control": "branch",
      "meter": true
    },
    {
      "title": "短接一只电阻后发生什么？",
      "question": "串联 R₂ 被短路，R₁ 是否仍限制电流？",
      "steps": [
        "R₂ 两端电压变为零，R₂ 被导线旁路。",
        "总电阻从 R₁＋R₂ 降为 R₁。",
        "电流增大；R₁ 两端电压等于电源电压。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "先沿旁路线找被绕过的 R₂，再算余下 R₁是否限制电流；本图是局部短路，不是电源两极被直接短接。",
      "mode": "series",
      "control": "fault",
      "meter": true
    },
    {
      "title": "断路时，电压表可能有示数吗？",
      "question": "R₂ 断路，跨接 R₂ 的理想电压表怎样读？",
      "steps": [
        "主回路电流为零，完好 R₁ 两端电压为零。",
        "R₂ 断点两端可以有等于电源的电压。",
        "电压表有示数，不代表有正常工作电流。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "只设 R₂这一处断路，且 V₂跨断点、表内阻很大；让学生先判断 I≈0 和 U₁≈0，再看断点两端为何可接近 6 V。",
      "mode": "series",
      "control": "fault",
      "meter": true,
      "initialFault": "open"
    },
    {
      "title": "故障排查怎样减少猜测？",
      "question": "“A为零、V₂接近电源电压”支持哪种故障？",
      "steps": [
        "确认电源、接线和电表正常，且假定只有一处故障。",
        "本电路中支持 R₂ 断路的判断。",
        "若不说明单一故障与表的位置，现象可能不唯一。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "请学生先说电源、导线和两表正常、只有一处故障这些条件，再用 A≈0、V₂≈6 V 排查；不把本题结论套到所有断路。",
      "mode": "series",
      "control": "fault",
      "meter": true,
      "initialFault": "open"
    },
    {
      "title": "图像斜率代表什么？",
      "question": "同样是直线，横纵坐标换了结论还一样吗？",
      "steps": [
        "I-U 图像斜率 I/U＝1/R，越陡电阻越小。",
        "U-I 图像斜率 U/I＝R，越陡电阻越大。",
        "先读坐标、单位和范围，再比较。"
      ],
      "scene": "graph",
      "labels": [],
      "teacher": "先在横 U、纵 I 图中比较 10 Ω 与 20 Ω，再切换横 I、纵 U；同一组理想数据在换轴后陡缓次序相反，先读轴再说斜率。",
      "graph": "compare"
    },
    {
      "title": "安全范围：电流表限制什么？",
      "question": "U＝6 V、R₁＝10 Ω、R₂为0～20 Ω，I≤0.4 A。",
      "steps": [
        "总电阻至少6/0.4＝15 Ω。",
        "所以 R₂≥5 Ω。",
        "再结合 R₂≤20 Ω，得到5～20 Ω。"
      ],
      "scene": "safety",
      "labels": [],
      "teacher": "先用 I≤0.4 A 求 R总≥15 Ω，再与 R₂本身 0～20 Ω 的范围取交集；拖动滑片检查 5 Ω 端点。",
      "currentOnly": true
    },
    {
      "title": "安全范围：再加电压表限制",
      "question": "若 R₂ 两端还要求 U₂≤3 V，允许范围是多少？",
      "steps": [
        "U₂＝6R₂/(10＋R₂)≤3，得 R₂≤10 Ω。",
        "与电流条件 R₂≥5 Ω 取交集。",
        "最终5 Ω≤R₂≤10 Ω；范围内两表都不过量程。"
      ],
      "scene": "safety",
      "labels": [],
      "teacher": "在上一页 R₂≥5 Ω 之上再加 U₂≤3 V，求得 R₂≤10 Ω；拖动检查 5、10 Ω 两端，再交代模型未列出的额定值仍须另查。"
    },
    {
      "title": "课堂辨析：局部变化与整体约束",
      "question": "用一条分析链说明结果。",
      "steps": [
        "串联：R总→I→各部分 U，不能把某部分电压当恒定。",
        "并联恒压：各支路 U 不变，支路电流分别计算。",
        "涉及安全范围，对所有限制取交集，再验算端点。"
      ],
      "scene": "safety",
      "labels": [],
      "teacher": "让学生口述串联与并联两条不同的变化链；遇到安全范围时列出所有已给限制，取交集并逐端点验算。"
    }
  ]
};
