import torch.cuda

from .MicKey.compute_pose import MickeyRelativePose

def build_model(cfg, checkpoint=''):

    if cfg.MODEL == 'MicKey':

        model = MickeyRelativePose(cfg)

        checkpoint_loaded = torch.load(checkpoint, map_location=torch.device('cpu'))
        model.on_load_checkpoint(checkpoint_loaded)
        model.load_state_dict(checkpoint_loaded['state_dict'])

        if torch.cuda.is_available():
            model = model.cuda()
        model.eval()
        return model
    else:
        raise NotImplementedError()
