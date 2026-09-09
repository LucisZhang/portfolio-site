# GroupConv Atlas: RTX 4090 evidence

Measured on 8 September 2026, RTX 4090, PyTorch 2.8.0+cu128, cuDNN 9.10.2. Historical RTX 4090 D and Apple OpenCL results are separate environments.

The 80-shape Atlas contains 480 records: 430 PASS and 50 UNSUPPORTED (k2), with ten batches of thirty samples per PASS. Complete FP32 and 64 independent FP64 point checks passed. Ratios are baseline / candidate. k3 against k0: graph 3.8718×, synchronized API 3.4490×. Against tuned PyTorch: graph 0.7384×, API 0.6448×. No overall tuned-framework win is claimed.

Triton holdout retains all 40 shapes: 15 supported, 25 unsupported. Supported-point geometric ratios against tuned PyTorch are graph 1.446×, synchronized API 0.921×, host-feed 0.550×. Five batches and separate processes support descriptive comparisons only, not paired statistical wins.

cuDNN Frontend: 32/32 paths passed across eight shapes, two layouts, and resident/caller-NCHW boundaries. Selection, workspace, numerical filters and timing setup remain distinct.

MobileNetV2 features[3] uses random weights and replaces one convolution. N=1 block graph ratio 1.04879× (TIE), synchronized API 0.66465× (LOSS); N=4 graph 1.13849× (WIN), API 0.67902× (LOSS), under the paired ten-batch 95% bootstrap and 5% practical threshold. This is neither whole-model speedup nor accuracy evidence.

Nsight Compute: 30 formal captures and one probe audited; cache-control all and uncontrolled clocks are separate from ordinary timing. Static re-exports of 33 profile/microbenchmark reports matched original CSV bytes. Microbenchmarks describe 860.38–876.41 GB/s logical bandwidth and 79.90–82.48 TFLOP/s, not sustainable peaks. Roofline remains NOT_ASSESSED. Static PTX/cache/SASS associations do not independently establish the launched binary or speedup causality.

Source: session-20260908-vast-03 analysis-atlas, analysis-triton, analysis-supplemental, analysis-profile, and analysis-microbench. Regeneration: audited source summaries; compare the adjacent hashed Atlas and provenance.

Data and figures: CC-BY-4.0. Project code: MIT. Attribution: Xiangguo Zhang, GroupConv Atlas.
