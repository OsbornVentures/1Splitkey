using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SplitKey.Domain
{
    public class WorkerCard
    {
        public Guid Id { get; set; }

        public Worker Worker { get; set; }
        public GraphicCard Card { get; set; }
    }
}
