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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
      "mode": "parallel",
      "control": "branch",
      "meter": true
    },
    {
      "title": "短接一只电阻后发生什么？",
      "question": "串联 R₂ 被短路，R₁ 是否仍限制电流？",
      "steps": [
        "R₂ 两端电压变为零，该支路电阻被旁路。",
        "总电阻从 R₁＋R₂ 降为 R₁。",
        "电流增大；R₁ 两端电压等于电源电压。"
      ],
      "scene": "circuit",
      "labels": [],
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。",
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。"
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。"
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
      "teacher": "先让学生预测并说明依据，再逐步揭示。区分观察、模型与结论，追问适用条件。"
    }
  ]
};
